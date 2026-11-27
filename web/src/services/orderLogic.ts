import type { OrderStatusKey, OrderType, Product, ProductStatus } from '../types/domain';
import {
  MAX_DISCOUNT_PERCENT,
  MAX_ORDER_QUANTITY,
  MAX_PRICE_SOM,
  MAX_WHOLESALE_QUANTITY,
  MIN_ORDER_QUANTITY,
  PERCENT_DIVISOR,
  PREPAYMENT_PERCENT,
} from './constants.ts';

/**
 * Computes remaining stock after an order using explicit boundary checks.
 * Returns updated stock count or throws if quantity violates limits or stock.
 */
export function computeRemainingStock(
  currentStock: number,
  quantity: number,
  maxQty = MAX_ORDER_QUANTITY
): number {
  if (quantity < MIN_ORDER_QUANTITY) {
    throw new Error("Buyurtma miqdori kamida 1 bo'lishi kerak.");
  }
  if (quantity > maxQty) {
    throw new Error(`Bir buyurtmada ko'pi bilan ${maxQty} dona tanlash mumkin.`);
  }
  if (quantity > currentStock) {
    throw new Error(`Zaxira yetarli emas (${currentStock} ta qolgan).`);
  }
  return currentStock - quantity;
}

export function applyStockDecrement(
  currentStock: number | null,
  quantity: number,
  currentStatus: ProductStatus,
  maxQty = MAX_ORDER_QUANTITY
): { nextStock: number | null; nextStatus: ProductStatus } {
  if (!Number.isInteger(quantity)) {
    throw new Error("Buyurtma miqdori butun son bo'lishi kerak.");
  }
  if (currentStock === null) {
    computeRemainingStock(maxQty, quantity, maxQty);
    return { nextStock: null, nextStatus: currentStatus };
  }
  const nextStock = computeRemainingStock(currentStock, quantity, maxQty);
  return {
    nextStock,
    nextStatus: nextStock === 0 ? 'sold_out' : currentStatus,
  };
}

export function calculateOrderTotal(
  unitPrice: number,
  quantity: number,
  maxQty = MAX_ORDER_QUANTITY
): number {
  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > MAX_PRICE_SOM) {
    throw new Error("Mahsulot narxi noto'g'ri.");
  }
  if (!Number.isInteger(quantity) || quantity < MIN_ORDER_QUANTITY || quantity > maxQty) {
    throw new Error(`Buyurtma miqdori 1 dan ${maxQty} gacha bo'lishi kerak.`);
  }
  return Math.round(unitPrice) * quantity;
}

/** Computes unit price, allowed quantity bounds, and wholesale savings for retail or wholesale orders. */
export function resolveOrderModePricing(params: {
  product: Pick<
    Product,
    | 'price'
    | 'discountPercent'
    | 'discountEndsAtMs'
    | 'wholesaleEnabled'
    | 'wholesaleOnly'
    | 'wholesaleMinQty'
    | 'wholesalePrice'
  >;
  quantity: number;
  orderType: OrderType;
  nowMs?: number;
}): { unitPrice: number; totalPrice: number; maxQty: number; minQty: number } {
  const { product, quantity, orderType, nowMs = Date.now() } = params;
  if (product.wholesaleOnly && orderType !== 'wholesale') {
    throw new Error('Bu mahsulot faqat optom bozor orqali partiya bilan sotiladi.');
  }
  if (orderType === 'wholesale') {
    if (
      !product.wholesaleEnabled ||
      !product.wholesaleMinQty ||
      !product.wholesalePrice ||
      product.wholesalePrice <= 0
    ) {
      throw new Error('Ushbu mahsulot uchun optom savdo yoqilmagan.');
    }
    if (quantity < product.wholesaleMinQty) {
      throw new Error(`Optom buyurtma kamida ${product.wholesaleMinQty} dona bo‘lishi kerak.`);
    }
    const totalPrice = calculateOrderTotal(
      product.wholesalePrice,
      quantity,
      MAX_WHOLESALE_QUANTITY
    );
    return {
      unitPrice: product.wholesalePrice,
      totalPrice,
      minQty: product.wholesaleMinQty,
      maxQty: MAX_WHOLESALE_QUANTITY,
    };
  }

  const discountActive =
    product.discountPercent > 0 &&
    product.discountPercent <= MAX_DISCOUNT_PERCENT &&
    (product.discountEndsAtMs === null || product.discountEndsAtMs > nowMs);
  const unitPrice = discountActive
    ? product.price - Math.floor((product.price * product.discountPercent) / PERCENT_DIVISOR)
    : product.price;
  return {
    unitPrice,
    totalPrice: calculateOrderTotal(unitPrice, quantity, MAX_ORDER_QUANTITY),
    minQty: MIN_ORDER_QUANTITY,
    maxQty: MAX_ORDER_QUANTITY,
  };
}

export function getWholesaleSavingsPercent(
  product: Pick<Product, 'price' | 'wholesaleEnabled' | 'wholesalePrice'>
): number {
  if (!product.wholesaleEnabled || !product.wholesalePrice || product.price <= 0) return 0;
  if (product.wholesalePrice >= product.price) return 0;
  return Math.round(((product.price - product.wholesalePrice) * PERCENT_DIVISOR) / product.price);
}

/**
 * Splits an order total into upfront advance (50%, rounded up) and remaining pickup/delivery balance.
 * Enforces prepaymentAmount + remainingAmount === totalPrice and prepaymentAmount * 2 >= totalPrice.
 */
export function calculateOrderPrepayment(totalPrice: number): {
  prepaymentPercent: number;
  prepaymentAmount: number;
  remainingAmount: number;
} {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    throw new Error("Buyurtma summasi 0 dan katta bo'lishi kerak.");
  }
  const roundedTotal = Math.round(totalPrice);
  const prepaymentAmount = Math.ceil((roundedTotal * PREPAYMENT_PERCENT) / PERCENT_DIVISOR);
  return {
    prepaymentPercent: PREPAYMENT_PERCENT,
    prepaymentAmount,
    remainingAmount: roundedTotal - prepaymentAmount,
  };
}

const OWNER_TRANSITIONS: Record<OrderStatusKey, readonly OrderStatusKey[]> = {
  pending: ['accepted', 'cancelled', 'rejected'],
  accepted: ['ready', 'cancelled', 'rejected'],
  ready: ['completed', 'cancelled', 'rejected'],
  completed: [],
  rejected: [],
  cancelled: [],
};

export function isValidOrderTransition(
  actor: 'customer' | 'owner',
  currentStatus: OrderStatusKey,
  nextStatus: OrderStatusKey
): boolean {
  if (actor === 'customer') {
    return currentStatus === 'pending' && nextStatus === 'cancelled';
  }
  return OWNER_TRANSITIONS[currentStatus].includes(nextStatus);
}
