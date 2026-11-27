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
  MAX_ADMIN_NOTE_LENGTH,
  MAX_BUSINESS_ADDRESS_LENGTH,
  MAX_BUSINESS_NAME_LENGTH,
  MAX_BUSINESS_SUMMARY_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
  MAX_TYPE_NOTE_LENGTH,
} from '../services/constants';
import {
  sanitizeUserText,
  validateBusinessForm,
  validateRejectionReason,
} from '../services/validators';
import type { Business, BusinessStatus, BusinessTypeKey, LegalFormKey } from '../types/domain';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

const VALID_TYPES: BusinessTypeKey[] = [
  'bakery',
  'confectionery',
  'pastry',
  'teahouse',
  'kitchen',
  'cafe',
  'other',
];

function sanitizeSummary(raw: string | undefined, max = MAX_BUSINESS_SUMMARY_LENGTH): string {
  return sanitizeUserText(raw ?? '', max);
}

export function mapBusinessDoc(id: string, data: Record<string, unknown>): Business {
  const rawType = typeof data.type === 'string' ? data.type : 'other';
  const type = VALID_TYPES.includes(rawType as BusinessTypeKey)
    ? (rawType as BusinessTypeKey)
    : 'other';

  const rawStatus = typeof data.status === 'string' ? data.status : 'pending';
  const validStatuses: BusinessStatus[] = ['pending', 'approved', 'rejected', 'suspended'];
  const status = validStatuses.includes(rawStatus as BusinessStatus)
    ? (rawStatus as BusinessStatus)
    : 'pending';

  const legalForm: LegalFormKey | undefined =
    data.legalForm === 'mchj' || data.legalForm === 'yatt' ? data.legalForm : undefined;

  return {
    id,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    name: typeof data.name === 'string' ? data.name : '',
    type,
    legalForm,
    address: typeof data.address === 'string' ? data.address : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    status,
    typeNote: typeof data.typeNote === 'string' ? data.typeNote : undefined,
    activitySummary: typeof data.activitySummary === 'string' ? data.activitySummary : undefined,
    productsSummary: typeof data.productsSummary === 'string' ? data.productsSummary : undefined,
    adminNote: typeof data.adminNote === 'string' ? data.adminNote : undefined,
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
    legalForm?: LegalFormKey;
    activitySummary?: string;
    productsSummary?: string;
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
    if (params.legalForm) payload.legalForm = params.legalForm;
    const act = sanitizeSummary(params.activitySummary);
    const prods = sanitizeSummary(params.productsSummary);
    if (act) payload.activitySummary = act;
    if (prods) payload.productsSummary = prods;
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
    legalForm?: LegalFormKey;
    activitySummary?: string;
    productsSummary?: string;
  }): Promise<void> {
    const cleanNote = sanitizeUserText(params.typeNote ?? '', MAX_TYPE_NOTE_LENGTH);
    const check = validateBusinessForm({ ...params, typeNote: cleanNote });
    if (!check.valid) throw new Error(check.error);

    const db = getFirebaseDb();
    const updates: Record<string, unknown> = {
      name: sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH),
      type: params.type,
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      typeNote: params.type === 'other' && cleanNote ? cleanNote : deleteField(),
      updatedAt: serverTimestamp(),
    };
    if (params.legalForm) updates.legalForm = params.legalForm;
    if (params.activitySummary !== undefined) {
      const act = sanitizeSummary(params.activitySummary);
      updates.activitySummary = act || deleteField();
    }
    if (params.productsSummary !== undefined) {
      const prods = sanitizeSummary(params.productsSummary);
      updates.productsSummary = prods || deleteField();
    }
    await updateDoc(doc(db, 'businesses', params.businessId), updates);
  },

  async resubmit(params: {
    businessId: string;
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
    legalForm?: LegalFormKey;
    activitySummary?: string;
    productsSummary?: string;
  }): Promise<void> {
    const cleanNote = sanitizeUserText(params.typeNote ?? '', MAX_TYPE_NOTE_LENGTH);
    const check = validateBusinessForm({ ...params, typeNote: cleanNote });
    if (!check.valid) throw new Error(check.error);

    const db = getFirebaseDb();
    const updates: Record<string, unknown> = {
      name: sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH),
      type: params.type,
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      status: 'pending',
      rejectionReason: deleteField(),
      typeNote: params.type === 'other' && cleanNote ? cleanNote : deleteField(),
      updatedAt: serverTimestamp(),
    };
    if (params.legalForm) updates.legalForm = params.legalForm;
    if (params.activitySummary !== undefined) {
      const act = sanitizeSummary(params.activitySummary);
      updates.activitySummary = act || deleteField();
    }
    if (params.productsSummary !== undefined) {
      const prods = sanitizeSummary(params.productsSummary);
      updates.productsSummary = prods || deleteField();
    }
    await updateDoc(doc(db, 'businesses', params.businessId), updates);
  },

  async adminSaveAndVerify(params: {
    businessId: string;
    name: string;
    legalForm: LegalFormKey;
    type: BusinessTypeKey;
    typeNote?: string;
    address: string;
    phone: string;
    activitySummary: string;
    productsSummary: string;
    adminNote?: string;
    approveNow?: boolean;
  }): Promise<void> {
    const cleanNote = sanitizeUserText(params.typeNote ?? '', MAX_TYPE_NOTE_LENGTH);
    const check = validateBusinessForm({ ...params, typeNote: cleanNote });
    if (!check.valid) throw new Error(check.error);

    const act = sanitizeSummary(params.activitySummary);
    const prods = sanitizeSummary(params.productsSummary);
    const note = sanitizeSummary(params.adminNote, MAX_ADMIN_NOTE_LENGTH);
    const payload: Record<string, unknown> = {
      name: sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH),
      legalForm: params.legalForm,
      type: params.type,
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      typeNote: params.type === 'other' && cleanNote ? cleanNote : deleteField(),
      activitySummary: act || deleteField(),
      productsSummary: prods || deleteField(),
      adminNote: note || deleteField(),
      updatedAt: serverTimestamp(),
    };
    if (params.approveNow) {
      payload.status = 'approved';
      payload.rejectionReason = deleteField();
    }
    await updateDoc(doc(getFirebaseDb(), 'businesses', params.businessId), payload);
  },

  async adminCreateForOwner(params: {
    ownerId: string;
    name: string;
    legalForm: LegalFormKey;
    type: BusinessTypeKey;
    typeNote?: string;
    address: string;
    phone: string;
    activitySummary: string;
    productsSummary: string;
    adminNote?: string;
    approveNow?: boolean;
  }): Promise<string> {
    const cleanNote = sanitizeUserText(params.typeNote ?? '', MAX_TYPE_NOTE_LENGTH);
    const check = validateBusinessForm({ ...params, typeNote: cleanNote });
    if (!check.valid) throw new Error(check.error);

    const act = sanitizeSummary(params.activitySummary);
    const prods = sanitizeSummary(params.productsSummary);
    const note = sanitizeSummary(params.adminNote, MAX_ADMIN_NOTE_LENGTH);
    const payload: Record<string, unknown> = {
      ownerId: params.ownerId,
      name: sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH),
      legalForm: params.legalForm,
      type: params.type,
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      status: params.approveNow ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (params.type === 'other' && cleanNote) payload.typeNote = cleanNote;
    if (act) payload.activitySummary = act;
    if (prods) payload.productsSummary = prods;
    if (note) payload.adminNote = note;
    const ref = await addDoc(collection(getFirebaseDb(), 'businesses'), payload);
    return ref.id;
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
