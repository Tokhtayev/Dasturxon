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
  MAX_EMAIL_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_PHONE_LENGTH,
} from '../services/constants';
import { sanitizeUserText, validateOwnerInquiry } from '../services/validators';
import type { BusinessTypeKey, InquiryStatus, LegalFormKey, OwnerInquiry } from '../types/domain';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

export function mapInquiryDoc(id: string, data: Record<string, unknown>): OwnerInquiry {
  const legalForm: LegalFormKey = data.legalForm === 'mchj' ? 'mchj' : 'yatt';
  const status: InquiryStatus =
    data.status === 'replied' || data.status === 'registered' ? data.status : 'waiting';

  return {
    id,
    ownerName: typeof data.ownerName === 'string' ? data.ownerName : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    email: typeof data.email === 'string' && data.email ? data.email : undefined,
    ownerUid: typeof data.ownerUid === 'string' && data.ownerUid ? data.ownerUid : undefined,
    legalForm,
    businessType:
      typeof data.businessType === 'string' ? (data.businessType as BusinessTypeKey) : undefined,
    businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    activitySummary: typeof data.activitySummary === 'string' ? data.activitySummary : '',
    productsSummary: typeof data.productsSummary === 'string' ? data.productsSummary : '',
    status,
    adminReply:
      typeof data.adminReply === 'string' && data.adminReply ? data.adminReply : undefined,
    createdAtMs: toMillis(data.createdAt),
    updatedAtMs: toMillis(data.updatedAt),
  };
}

export const inquiryRepository = {
  async createInquiry(params: {
    ownerName: string;
    phone: string;
    email?: string;
    ownerUid?: string;
    legalForm: LegalFormKey;
    businessType?: BusinessTypeKey;
    businessName?: string;
    address?: string;
    activitySummary: string;
    productsSummary: string;
  }): Promise<string> {
    const check = validateOwnerInquiry(params);
    if (!check.valid) throw new Error(check.error);

    const payload: Record<string, unknown> = {
      ownerName: sanitizeUserText(params.ownerName, MAX_FULL_NAME_LENGTH),
      phone: sanitizeUserText(params.phone, MAX_PHONE_LENGTH),
      legalForm: params.legalForm,
      activitySummary: sanitizeUserText(params.activitySummary, MAX_BUSINESS_SUMMARY_LENGTH),
      productsSummary: sanitizeUserText(params.productsSummary, MAX_BUSINESS_SUMMARY_LENGTH),
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const cleanEmail = sanitizeUserText(params.email ?? '', MAX_EMAIL_LENGTH);
    const cleanBizName = sanitizeUserText(params.businessName ?? '', MAX_BUSINESS_NAME_LENGTH);
    const cleanAddr = sanitizeUserText(params.address ?? '', MAX_BUSINESS_ADDRESS_LENGTH);
    if (cleanEmail) payload.email = cleanEmail;
    if (params.ownerUid) payload.ownerUid = params.ownerUid;
    if (params.businessType) payload.businessType = params.businessType;
    if (cleanBizName) payload.businessName = cleanBizName;
    if (cleanAddr) payload.address = cleanAddr;

    const ref = await addDoc(collection(getFirebaseDb(), 'ownerInquiries'), payload);
    return ref.id;
  },

  observeForOwner(
    ownerUid: string,
    onData: (inquiries: OwnerInquiry[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(getFirebaseDb(), 'ownerInquiries'),
      where('ownerUid', '==', ownerUid)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapInquiryDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        onData(list);
      },
      (err) => onError(new Error(err.message))
    );
  },

  observeAllForAdmin(
    onData: (inquiries: OwnerInquiry[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(getFirebaseDb(), 'ownerInquiries'),
      (snap) => {
        const list = snap.docs
          .map((d) => mapInquiryDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        onData(list);
      },
      (err) => onError(new Error(err.message))
    );
  },

  async adminUpdateInquiry(params: {
    inquiryId: string;
    legalForm: LegalFormKey;
    businessType: BusinessTypeKey;
    businessName?: string;
    address: string;
    activitySummary: string;
    productsSummary: string;
    adminReply: string;
    status: InquiryStatus;
  }): Promise<void> {
    const reply = sanitizeUserText(params.adminReply, MAX_ADMIN_NOTE_LENGTH);
    const bizName = sanitizeUserText(params.businessName ?? '', MAX_BUSINESS_NAME_LENGTH);
    await updateDoc(doc(getFirebaseDb(), 'ownerInquiries', params.inquiryId), {
      legalForm: params.legalForm,
      businessType: params.businessType,
      businessName: bizName || deleteField(),
      address: sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH),
      activitySummary: sanitizeUserText(params.activitySummary, MAX_BUSINESS_SUMMARY_LENGTH),
      productsSummary: sanitizeUserText(params.productsSummary, MAX_BUSINESS_SUMMARY_LENGTH),
      adminReply: reply || deleteField(),
      status: params.status,
      updatedAt: serverTimestamp(),
    });
  },
};
