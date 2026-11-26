import {
  collection,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import {
  MAX_DISCOUNT_PERCENT,
  MAX_FULL_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  PERCENT_DIVISOR,
  TERMINAL_ORDER_STATUSES,
} from '../services/constants';
import { applyStockDecrement, calculateOrderTotal } from '../services/orderLogic';
import {
  sanitizeDeliveryAddress,
  sanitizeImageUrl,
  sanitizeUserText,
} from '../services/validators';
import type {
  Business,
  CustomerOrder,
  FulfillmentType,
  OrderStatusKey,
  PaymentStatus,
  Product,
} from '../types/domain';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

export function mapOrderDoc(id: string, data: Record<string, unknown>): CustomerOrder {
  const rawStatus = typeof data.status === 'string' ? data.status : 'pending';
  const normalizedStatus: OrderStatusKey =
    rawStatus === 'new'
      ? 'pending'
      : rawStatus === 'done'
        ? 'completed'
        : ['pending', 'accepted', 'ready', 'completed', 'rejected', 'cancelled'].includes(rawStatus)
          ? (rawStatus as OrderStatusKey)
          : 'pending';

  const quantity = typeof data.quantity === 'number' ? data.quantity : 0;
  const unitPrice = typeof data.unitPrice === 'number' ? data.unitPrice : 0;
  const totalPrice = typeof data.totalPrice === 'number' ? data.totalPrice : unitPrice * quantity;

  return {
    id,
    customerId: typeof data.customerId === 'string' ? data.customerId : '',
    customerName: typeof data.customerName === 'string' ? data.customerName : '',
    customerPhone: typeof data.customerPhone === 'string' ? data.customerPhone : '',
    businessId: typeof data.businessId === 'string' ? data.businessId : '',
    businessName: typeof data.businessName === 'string' ? data.businessName : '',
    productId: typeof data.productId === 'string' ? data.productId : '',
    productName: typeof data.productName === 'string' ? data.productName : '',
    quantity,
    unitPrice,
    totalPrice,
    status: normalizedStatus,
    paymentStatus: data.paymentStatus === 'paid' ? 'paid' : 'unpaid',
    fulfillmentType: data.fulfillmentType === 'delivery' ? 'delivery' : 'pickup',
    deliveryAddress: typeof data.deliveryAddress === 'string' ? data.deliveryAddress : '',
    pickupTimeMs: toMillis(data.pickupTime),
    createdAtMs: toMillis(data.createdAt),
    updatedAtMs: toMillis(data.updatedAt),
    paidAtMs: data.paidAt ? toMillis(data.paidAt) : undefined,
    receiptUrl:
      typeof data.receiptUrl === 'string' && data.receiptUrl.trim() ? data.receiptUrl : undefined,
    receiptUploadedAtMs: data.receiptUploadedAt ? toMillis(data.receiptUploadedAt) : undefined,
  };
}

export const orderRepository = {
  observeForCustomer(
    customerId: string,
    onData: (orders: CustomerOrder[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapOrderDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        onData(list);
      },
      (err) => onError(new Error(err.message))
    );
  },

  observeForBusiness(
    businessId: string,
    onData: (orders: CustomerOrder[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(collection(db, 'orders'), where('businessId', '==', businessId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapOrderDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        onData(list);
      },
      (err) => onError(new Error(err.message))
    );
  },

  /**
   * Executes atomic Firestore checkout transaction:
   * - Verifies business is approved and product is available/hot_ready
   * - Computes exact unitPrice matching firestore.rules expectedLineItemPrice
   * - Creates orders/{orderId} and orders/{orderId}/items/{itemId}
   * - Atomically decrements product stock with lastCheckoutOrderId
   */
  async placeOrderTransaction(params: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    business: Business;
    product: Product;
    quantity: number;
    pickupTimeMs: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
  }): Promise<string> {
    const db = getFirebaseDb();
    const productRef = doc(db, 'products', params.product.id);
    const businessRef = doc(db, 'businesses', params.business.id);
    const orderRef = doc(collection(db, 'orders'));
    const itemRef = doc(collection(orderRef, 'items'));

    await runTransaction(db, async (tx) => {
      const prodSnap = await tx.get(productRef);
      const bizSnap = await tx.get(businessRef);

      if (!bizSnap.exists() || bizSnap.data().status !== 'approved') {
        throw new Error('Bu biznes hozir buyurtma qabul qilmayapti.');
      }
      if (!prodSnap.exists()) {
        throw new Error('Mahsulot topilmadi.');
      }

      const pData = prodSnap.data();
      const status = typeof pData.status === 'string' ? pData.status : 'sold_out';
      const currentStock = typeof pData.stock === 'number' ? pData.stock : null;
      const price = typeof pData.price === 'number' ? pData.price : 0;
      const discountPercent = typeof pData.discountPercent === 'number' ? pData.discountPercent : 0;
      const discountEndsAt =
        pData.discountEndsAt instanceof Timestamp ? pData.discountEndsAt : null;

      if (!['available', 'hot_ready'].includes(status)) {
        throw new Error('Mahsulot hozir mavjud emas.');
      }
      const { nextStock, nextStatus } = applyStockDecrement(
        currentStock,
        params.quantity,
        status === 'hot_ready' ? 'hot_ready' : 'available'
      );

      const discountActive =
        discountPercent > 0 &&
        discountPercent <= MAX_DISCOUNT_PERCENT &&
        (discountEndsAt === null || discountEndsAt.toMillis() > Date.now());
      const unitPrice = discountActive
        ? price - Math.floor((price * discountPercent) / PERCENT_DIVISOR)
        : price;
      const totalPrice = calculateOrderTotal(unitPrice, params.quantity);
      const productName = typeof pData.name === 'string' ? pData.name : params.product.name;

      tx.set(orderRef, {
        customerId: params.customerId,
        customerName: sanitizeUserText(params.customerName, MAX_FULL_NAME_LENGTH) || 'Xaridor',
        customerPhone: sanitizeUserText(params.customerPhone, MAX_PHONE_LENGTH),
        businessId: params.business.id,
        businessName: params.business.name,
        productId: params.product.id,
        productName,
        quantity: params.quantity,
        unitPrice,
        totalPrice,
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentType: params.fulfillmentType,
        deliveryAddress:
          params.fulfillmentType === 'delivery'
            ? sanitizeDeliveryAddress(params.deliveryAddress)
            : '',
        pickupTime: Timestamp.fromMillis(params.pickupTimeMs),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(itemRef, {
        productId: params.product.id,
        name: productName,
        qty: params.quantity,
        unitPrice,
      });

      if (nextStock !== null) {
        tx.update(productRef, {
          stock: nextStock,
          status: nextStatus,
          lastCheckoutOrderId: orderRef.id,
          updatedAt: serverTimestamp(),
        });
      }
    });

    return orderRef.id;
  },

  async cancelPendingOrder(orderId: string): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  },

  async updateStatus(orderId: string, status: OrderStatusKey): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  async rejectOrderAndRestoreStock(
    orderId: string,
    terminalStatus: 'rejected' | 'cancelled' = 'rejected'
  ): Promise<void> {
    const db = getFirebaseDb();
    const orderRef = doc(db, 'orders', orderId);
    await runTransaction(db, async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw new Error('Buyurtma topilmadi.');
      const oData = orderSnap.data();
      if (TERMINAL_ORDER_STATUSES.includes(String(oData.status) as OrderStatusKey)) {
        throw new Error("Ushbu buyurtmani bekor qilib bo'lmaydi.");
      }

      const productId = typeof oData.productId === 'string' ? oData.productId : '';
      const qty = typeof oData.quantity === 'number' ? oData.quantity : 0;

      if (productId && qty > 0) {
        const productRef = doc(db, 'products', productId);
        const prodSnap = await tx.get(productRef);
        const pData = prodSnap.exists() ? prodSnap.data() : null;
        if (pData && typeof pData.stock === 'number') {
          const restored = pData.stock + qty;
          const updates: Record<string, unknown> = {
            stock: restored,
            updatedAt: serverTimestamp(),
          };
          if (pData.status === 'sold_out' && restored > 0) {
            updates.status = 'available';
          }
          tx.update(productRef, updates);
        }
      }

      tx.update(orderRef, {
        status: terminalStatus,
        updatedAt: serverTimestamp(),
      });
    });
  },

  async completeOrderWithUnitCost(orderId: string, unitCost: number): Promise<void> {
    const db = getFirebaseDb();
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: 'completed',
      updatedAt: serverTimestamp(),
    });

    if (unitCost > 0) {
      const itemsSnap = await getDocs(collection(orderRef, 'items'));
      if (!itemsSnap.empty) {
        const batch = writeBatch(db);
        itemsSnap.docs.forEach((d) => {
          batch.update(d.ref, { unitCost: Math.round(unitCost) });
        });
        await batch.commit();
      }
    }
  },

  async setPaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    options?: { receiptUrl?: string; preservePaidAt?: boolean }
  ): Promise<void> {
    const db = getFirebaseDb();
    const payload: Record<string, unknown> = {
      paymentStatus,
      updatedAt: serverTimestamp(),
    };
    if (paymentStatus === 'paid') {
      if (!options?.preservePaidAt) {
        payload.paidAt = serverTimestamp();
      }
      if (options?.receiptUrl !== undefined) {
        const safeReceiptUrl = sanitizeImageUrl(options.receiptUrl);
        payload.receiptUrl = safeReceiptUrl;
        payload.receiptUploadedAt = safeReceiptUrl ? serverTimestamp() : deleteField();
      }
    } else {
      payload.paidAt = deleteField();
      payload.receiptUrl = '';
      payload.receiptUploadedAt = deleteField();
    }
    await updateDoc(doc(db, 'orders', orderId), payload);
  },

  async loadCompletedItemCosts(orderIds: string[]): Promise<Map<string, number>> {
    const db = getFirebaseDb();
    const map = new Map<string, number>();
    await Promise.all(
      orderIds.map(async (orderId) => {
        try {
          const snap = await getDocs(collection(db, 'orders', orderId, 'items'));
          const first = snap.docs[0]?.data();
          if (first && typeof first.unitCost === 'number') {
            map.set(orderId, first.unitCost);
          }
        } catch {
          // ignore if missing
        }
      })
    );
    return map;
  },
};
