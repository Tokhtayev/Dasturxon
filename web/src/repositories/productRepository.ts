import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import type { Business, BusinessTypeKey, Product, ProductStatus } from '../types/domain';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

export function mapProductDoc(id: string, data: Record<string, unknown>): Product {
  const rawType = typeof data.businessType === 'string' ? data.businessType : 'other';
  const rawStatus = typeof data.status === 'string' ? data.status : 'available';
  const status: ProductStatus =
    rawStatus === 'hot_ready' || rawStatus === 'sold_out' || rawStatus === 'available'
      ? rawStatus
      : 'available';

  return {
    id,
    businessId: typeof data.businessId === 'string' ? data.businessId : '',
    businessName: typeof data.businessName === 'string' ? data.businessName : '',
    businessType: rawType as BusinessTypeKey,
    businessAddress: typeof data.businessAddress === 'string' ? data.businessAddress : '',
    businessPhone: typeof data.businessPhone === 'string' ? data.businessPhone : '',
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : '',
    price: typeof data.price === 'number' ? data.price : 0,
    costPrice: 0, // Strictly never read from public product document
    published: typeof data.published === 'boolean' ? data.published : true,
    status,
    stock: typeof data.stock === 'number' ? data.stock : null,
    discountPercent: typeof data.discountPercent === 'number' ? data.discountPercent : 0,
    discountEndsAtMs: data.discountEndsAt ? toMillis(data.discountEndsAt) : null,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
    updatedAtMs: toMillis(data.updatedAt),
  };
}

export const productRepository = {
  /**
   * Observes published products ONLY for approved business IDs (chunks of 10),
   * guaranteeing the query provably satisfies firestore.rules isBusinessApproved().
   */
  observeFeedForApprovedBusinesses(
    approvedBusinessIds: string[],
    onData: (products: Product[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    if (approvedBusinessIds.length === 0) {
      onData([]);
      return () => {};
    }

    const db = getFirebaseDb();
    const chunks: string[][] = [];
    for (let i = 0; i < approvedBusinessIds.length; i += 10) {
      chunks.push(approvedBusinessIds.slice(i, i + 10));
    }

    const chunkResults = new Map<number, Product[]>();
    const emitMerged = () => {
      const merged = Array.from(chunkResults.values())
        .flat()
        .filter((p) => p.published)
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onData(merged);
    };

    const unsubs = chunks.map((chunk, idx) => {
      const q = query(collection(db, 'products'), where('businessId', 'in', chunk));
      return onSnapshot(
        q,
        (snap) => {
          chunkResults.set(
            idx,
            snap.docs.map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
          );
          emitMerged();
        },
        (err) => onError(new Error(err.message))
      );
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  },

  observeForBusiness(
    businessId: string,
    onData: (products: Product[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(collection(db, 'products'), where('businessId', '==', businessId));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        onData(items);
      },
      (err) => onError(new Error(err.message))
    );
  },

  async loadPrivateCostPrices(productIds: string[]): Promise<Map<string, number>> {
    const db = getFirebaseDb();
    const map = new Map<string, number>();
    await Promise.all(
      productIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, 'products', id, 'private', 'cost'));
          const cost = snap.exists() ? snap.data().costPrice : 0;
          map.set(id, typeof cost === 'number' ? cost : 0);
        } catch {
          map.set(id, 0);
        }
      })
    );
    return map;
  },

  async getPrivateCostPrice(productId: string): Promise<number> {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'products', productId, 'private', 'cost'));
    if (!snap.exists()) return 0;
    const cost = snap.data().costPrice;
    return typeof cost === 'number' ? cost : 0;
  },

  async create(params: {
    business: Business;
    name: string;
    description: string;
    price: number;
    costPrice: number;
    stock: number | null;
    discountPercent: number;
    discountEndsAtMs: number | null;
    status: ProductStatus;
    published: boolean;
  }): Promise<string> {
    const db = getFirebaseDb();
    const publicPayload: Record<string, unknown> = {
      businessId: params.business.id,
      businessName: params.business.name,
      businessType: params.business.type,
      businessAddress: params.business.address,
      businessPhone: params.business.phone,
      name: params.name.trim(),
      description: params.description.trim(),
      price: Math.round(params.price),
      published: params.published,
      imageUrl: '',
      status: params.status,
      discountPercent: Math.round(params.discountPercent),
      updatedAt: serverTimestamp(),
    };
    if (params.stock !== null) publicPayload.stock = Math.round(params.stock);
    if (params.discountEndsAtMs !== null) {
      publicPayload.discountEndsAt = Timestamp.fromMillis(params.discountEndsAtMs);
    }

    // costPrice is strictly omitted from public doc
    const docRef = await addDoc(collection(db, 'products'), publicPayload);
    if (params.costPrice > 0) {
      await setDoc(doc(db, 'products', docRef.id, 'private', 'cost'), {
        costPrice: Math.round(params.costPrice),
        updatedAt: serverTimestamp(),
      });
    }
    return docRef.id;
  },

  async update(params: {
    productId: string;
    name: string;
    description: string;
    price: number;
    costPrice: number;
    stock: number | null;
    discountPercent: number;
    discountEndsAtMs: number | null;
    status: ProductStatus;
    published: boolean;
  }): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'products', params.productId), {
      name: params.name.trim(),
      description: params.description.trim(),
      price: Math.round(params.price),
      published: params.published,
      status: params.status,
      discountPercent: Math.round(params.discountPercent),
      stock: params.stock !== null ? Math.round(params.stock) : deleteField(),
      discountEndsAt:
        params.discountEndsAtMs !== null
          ? Timestamp.fromMillis(params.discountEndsAtMs)
          : deleteField(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'products', params.productId, 'private', 'cost'), {
      costPrice: Math.max(0, Math.round(params.costPrice)),
      updatedAt: serverTimestamp(),
    });
  },

  async setStatus(productId: string, status: ProductStatus): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'products', productId), {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(productId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'products', productId));
  },
};
