import {
  addDoc,
  collection,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import type { Business, BusinessStatus, BusinessTypeKey } from '../types/domain';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

export function mapBusinessDoc(id: string, data: Record<string, unknown>): Business {
  const rawType = typeof data.type === 'string' ? data.type : 'other';
  const validTypes: BusinessTypeKey[] = [
    'bakery',
    'confectionery',
    'pastry',
    'teahouse',
    'kitchen',
    'cafe',
    'other',
  ];
  const type = validTypes.includes(rawType as BusinessTypeKey)
    ? (rawType as BusinessTypeKey)
    : 'other';

  const rawStatus = typeof data.status === 'string' ? data.status : 'pending';
  const validStatuses: BusinessStatus[] = ['pending', 'approved', 'rejected', 'suspended'];
  const status = validStatuses.includes(rawStatus as BusinessStatus)
    ? (rawStatus as BusinessStatus)
    : 'pending';

  return {
    id,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    name: typeof data.name === 'string' ? data.name : '',
    type,
    address: typeof data.address === 'string' ? data.address : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    status,
    typeNote: typeof data.typeNote === 'string' ? data.typeNote : undefined,
    rejectionReason: typeof data.rejectionReason === 'string' ? data.rejectionReason : undefined,
    createdAtMs: toMillis(data.createdAt),
    updatedAtMs: toMillis(data.updatedAt),
  };
}

export const businessRepository = {
  observeApproved(
    onData: (businesses: Business[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(collection(db, 'businesses'), where('status', '==', 'approved'));
    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => mapBusinessDoc(d.id, d.data() as Record<string, unknown>)));
      },
      (err) => onError(new Error(err.message))
    );
  },

  observeForOwner(
    ownerId: string,
    onData: (businesses: Business[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(collection(db, 'businesses'), where('ownerId', '==', ownerId));
    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => mapBusinessDoc(d.id, d.data() as Record<string, unknown>)));
      },
      (err) => onError(new Error(err.message))
    );
  },

  observeAll(onData: (businesses: Business[]) => void, onError: (err: Error) => void): Unsubscribe {
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, 'businesses'),
      (snap) => {
        const list = snap.docs
          .map((d) => mapBusinessDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        onData(list);
      },
      (err) => onError(new Error(err.message))
    );
  },

  async create(params: {
    ownerId: string;
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
  }): Promise<string> {
    const db = getFirebaseDb();
    const payload: Record<string, unknown> = {
      ownerId: params.ownerId,
      name: params.name.trim(),
      type: params.type,
      address: params.address.trim(),
      phone: params.phone.trim(),
      status: 'pending', // Enforced by firestore.rules
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const trimmedNote = params.typeNote?.trim();
    if (params.type === 'other' && trimmedNote) {
      payload.typeNote = trimmedNote;
    }
    const ref = await addDoc(collection(db, 'businesses'), payload);
    return ref.id;
  },

  async updateDetails(params: {
    businessId: string;
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
  }): Promise<void> {
    const db = getFirebaseDb();
    const trimmedNote = params.typeNote?.trim();
    await updateDoc(doc(db, 'businesses', params.businessId), {
      name: params.name.trim(),
      type: params.type,
      address: params.address.trim(),
      phone: params.phone.trim(),
      typeNote: params.type === 'other' && trimmedNote ? trimmedNote : deleteField(),
      updatedAt: serverTimestamp(),
    });
  },

  async resubmit(params: {
    businessId: string;
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
  }): Promise<void> {
    const db = getFirebaseDb();
    const trimmedNote = params.typeNote?.trim();
    await updateDoc(doc(db, 'businesses', params.businessId), {
      name: params.name.trim(),
      type: params.type,
      address: params.address.trim(),
      phone: params.phone.trim(),
      status: 'pending',
      rejectionReason: deleteField(),
      typeNote: params.type === 'other' && trimmedNote ? trimmedNote : deleteField(),
      updatedAt: serverTimestamp(),
    });
  },

  async setStatus(
    businessId: string,
    status: BusinessStatus,
    rejectionReason?: string
  ): Promise<void> {
    const db = getFirebaseDb();
    const payload: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (status === 'rejected' && rejectionReason?.trim()) {
      payload.rejectionReason = rejectionReason.trim();
    } else if (status === 'approved') {
      payload.rejectionReason = deleteField();
    }
    await updateDoc(doc(db, 'businesses', businessId), payload);
  },
};
