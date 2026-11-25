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
import {
  MAX_BUSINESS_ADDRESS_LENGTH,
  MAX_BUSINESS_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
  MAX_TYPE_NOTE_LENGTH,
} from '../services/constants';
import {
  sanitizeUserText,
  validateBusinessForm,
  validateRejectionReason,
} from '../services/validators';
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
    const cleanNote = sanitizeUserText(params.typeNote ?? '', MAX_TYPE_NOTE_LENGTH);
    const check = validateBusinessForm({ ...params, typeNote: cleanNote });
    if (!check.valid) throw new Error(check.error);

    const db = getFirebaseDb();
    const payload: Record<string, unknown> = {
      ownerId: params.ownerId,
      name: sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH),
      type: params.type,
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      status: 'pending', // Enforced by firestore.rules
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (params.type === 'other' && cleanNote) {
      payload.typeNote = cleanNote;
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
    const cleanNote = sanitizeUserText(params.typeNote ?? '', MAX_TYPE_NOTE_LENGTH);
    const check = validateBusinessForm({ ...params, typeNote: cleanNote });
    if (!check.valid) throw new Error(check.error);

    const db = getFirebaseDb();
    await updateDoc(doc(db, 'businesses', params.businessId), {
      name: sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH),
      type: params.type,
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      typeNote: params.type === 'other' && cleanNote ? cleanNote : deleteField(),
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
    const cleanNote = sanitizeUserText(params.typeNote ?? '', MAX_TYPE_NOTE_LENGTH);
    const check = validateBusinessForm({ ...params, typeNote: cleanNote });
    if (!check.valid) throw new Error(check.error);

    const db = getFirebaseDb();
    await updateDoc(doc(db, 'businesses', params.businessId), {
      name: sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH),
      type: params.type,
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      status: 'pending',
      rejectionReason: deleteField(),
      typeNote: params.type === 'other' && cleanNote ? cleanNote : deleteField(),
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
    if (status === 'rejected') {
      const check = validateRejectionReason(rejectionReason ?? '');
      if (!check.valid) throw new Error(check.error);
      payload.rejectionReason = sanitizeUserText(
        rejectionReason ?? '',
        MAX_REJECTION_REASON_LENGTH
      );
    } else if (status === 'approved') {
      payload.rejectionReason = deleteField();
    }
    await updateDoc(doc(db, 'businesses', businessId), payload);
  },
};
