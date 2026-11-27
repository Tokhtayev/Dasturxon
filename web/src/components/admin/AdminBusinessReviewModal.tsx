import React, { useState } from 'react';
import { MessageSquareText, PhoneCall, X } from 'lucide-react';
import { getReadableErrorMessage } from '../../services/errors';
import { buildSmsHref, buildTelHref } from '../../services/validators';
import {
  BUSINESS_TYPES,
  LEGAL_FORMS,
  type Business,
  type BusinessTypeKey,
  type InquiryStatus,
  type LegalFormKey,
  type OwnerInquiry,
} from '../../types/domain';

type ReviewTarget = { kind: 'business'; item: Business } | { kind: 'inquiry'; item: OwnerInquiry };

interface AdminBusinessReviewModalProps {
  target: ReviewTarget;
  onClose: () => void;
  onSaveBusiness: (params: {
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
  }) => Promise<void>;
  onSaveInquiry: (params: {
    inquiryId: string;
    legalForm: LegalFormKey;
    businessType: BusinessTypeKey;
    businessName?: string;
    address: string;
    activitySummary: string;
    productsSummary: string;
    adminReply: string;
    status: InquiryStatus;
  }) => Promise<void>;
  onCreateBusinessFromInquiry?: (params: {
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
  }) => Promise<string>;
}

interface ReviewFormDraft {
  legalForm: LegalFormKey;
  name: string;
  type: BusinessTypeKey;
  typeNote: string;
  address: string;
  phone: string;
  activitySummary: string;
  productsSummary: string;
  adminNote: string;
}

function initialDraft(target: ReviewTarget): ReviewFormDraft {
  const biz = target.kind === 'business' ? target.item : null;
  const inq = target.kind === 'inquiry' ? target.item : null;
  return {
    legalForm: (biz?.legalForm ?? inq?.legalForm ?? 'yatt') as LegalFormKey,
    name: biz?.name ?? inq?.businessName ?? '',
    type: biz?.type ?? inq?.businessType ?? 'bakery',
    typeNote: biz?.typeNote ?? '',
    address: biz?.address ?? inq?.address ?? '',
    phone: biz?.phone ?? inq?.phone ?? '',
    activitySummary: biz?.activitySummary ?? inq?.activitySummary ?? '',
    productsSummary: biz?.productsSummary ?? inq?.productsSummary ?? '',
    adminNote: biz?.adminNote ?? inq?.adminReply ?? '',
  };
}

async function submitReviewDraft(
  props: AdminBusinessReviewModalProps,
  draft: ReviewFormDraft,
  approveOrCreate: boolean
): Promise<void> {
  if (props.target.kind === 'business') {
    await props.onSaveBusiness({
      businessId: props.target.item.id,
      name: draft.name,
      legalForm: draft.legalForm,
      type: draft.type,
      typeNote: draft.typeNote,
      address: draft.address,
      phone: draft.phone,
      activitySummary: draft.activitySummary,
      productsSummary: draft.productsSummary,
      adminNote: draft.adminNote,
      approveNow: approveOrCreate,
    });
    return;
  }

  const inq = props.target.item;
  const canCreate = Boolean(approveOrCreate && inq.ownerUid && props.onCreateBusinessFromInquiry);
  if (canCreate && inq.ownerUid && props.onCreateBusinessFromInquiry) {
    await props.onCreateBusinessFromInquiry({
      ownerId: inq.ownerUid,
      name: draft.name.trim() || inq.ownerName,
      legalForm: draft.legalForm,
      type: draft.type,
      typeNote: draft.typeNote,
      address: draft.address,
      phone: draft.phone,
      activitySummary: draft.activitySummary,
      productsSummary: draft.productsSummary,
      adminNote: draft.adminNote,
      approveNow: true,
    });
  }
  await props.onSaveInquiry({
    inquiryId: inq.id,
    legalForm: draft.legalForm,
    businessType: draft.type,
    businessName: draft.name,
    address: draft.address,
    activitySummary: draft.activitySummary,
    productsSummary: draft.productsSummary,
    adminReply: draft.adminNote,
    status: canCreate ? 'registered' : 'replied',
  });
}

const ReviewContactHeader: React.FC<{
  title: string;
  subtitle: string;
  phone: string;
  smsBody: string;
  onClose: () => void;
}> = ({ title, subtitle, phone, smsBody, onClose }) => (
  <>
    <div className="flex items-start justify-between gap-2">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
          {subtitle}
        </p>
      </div>
      <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <a
        href={buildTelHref(phone)}
        className="px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        <PhoneCall className="w-3.5 h-3.5" style={{ color: 'var(--dx-primary)' }} /> Qo‘ng‘iroq
      </a>
      <a
        href={buildSmsHref(phone, smsBody)}
        className="px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        <MessageSquareText className="w-3.5 h-3.5" style={{ color: 'var(--dx-secondary)' }} /> SMS
        so‘rash
      </a>
    </div>
  </>
);

const ReviewFormInputs: React.FC<{
  draft: ReviewFormDraft;
  onPatch: (updates: Partial<ReviewFormDraft>) => void;
}> = ({ draft, onPatch }) => (
  <div className="space-y-2.5">
    <div>
      <div className="text-[11px] font-bold mb-1">1. Yuridik shakli (MChJ yoki YaTT)</div>
      <div className="grid grid-cols-2 gap-2">
        {LEGAL_FORMS.map((lf) => (
          <button
            key={lf.storedValue}
            type="button"
            onClick={() => onPatch({ legalForm: lf.storedValue })}
            className="p-2 rounded-xl border text-left cursor-pointer"
            style={{
              backgroundColor:
                draft.legalForm === lf.storedValue
                  ? 'var(--dx-secondary-container)'
                  : 'var(--dx-bg)',
              borderColor:
                draft.legalForm === lf.storedValue ? 'var(--dx-secondary)' : 'var(--dx-border)',
            }}
          >
            <div className="text-xs font-extrabold">{lf.labelUz}</div>
            <div className="text-[10px]" style={{ color: 'var(--dx-muted)' }}>
              {lf.hint}
            </div>
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <input
        value={draft.name}
        onChange={(e) => onPatch({ name: e.target.value })}
        placeholder="Biznes nomi"
        className="w-full px-3 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
      <select
        value={draft.type}
        onChange={(e) => onPatch({ type: e.target.value as BusinessTypeKey })}
        className="w-full px-3 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        {BUSINESS_TYPES.map((bt) => (
          <option key={bt.storedValue} value={bt.storedValue}>
            {bt.icon} {bt.labelUz}
          </option>
        ))}
      </select>
    </div>

    {draft.type === 'other' && (
      <input
        value={draft.typeNote}
        onChange={(e) => onPatch({ typeNote: e.target.value })}
        placeholder="Boshqa biznes turi izohi (3–40 belgi)"
        className="w-full px-3 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    )}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <input
        value={draft.address}
        onChange={(e) => onPatch({ address: e.target.value })}
        placeholder="Manzili (Yunusobod ...)"
        className="w-full px-3 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
      <input
        value={draft.phone}
        onChange={(e) => onPatch({ phone: e.target.value })}
        placeholder="Aloqa telefoni"
        className="w-full px-3 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>

    <textarea
      rows={2}
      value={draft.activitySummary}
      onChange={(e) => onPatch({ activitySummary: e.target.value })}
      placeholder="Faoliyati haqida qisqacha ma’lumot"
      className="w-full px-3 py-2 rounded-xl border text-xs"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <textarea
      rows={2}
      value={draft.productsSummary}
      onChange={(e) => onPatch({ productsSummary: e.target.value })}
      placeholder="Mahsulotlari haqida qisqacha ma’lumot"
      className="w-full px-3 py-2 rounded-xl border text-xs"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <textarea
      rows={2}
      value={draft.adminNote}
      onChange={(e) => onPatch({ adminNote: e.target.value })}
      placeholder="Biznes egasiga admin javobi / izoh"
      className="w-full px-3 py-2 rounded-xl border text-xs"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
  </div>
);

export const AdminBusinessReviewModal: React.FC<AdminBusinessReviewModalProps> = (props) => {
  const [draft, setDraft] = useState<ReviewFormDraft>(() => initialDraft(props.target));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isInquiry = props.target.kind === 'inquiry';
  const canApprove = props.target.kind === 'business' || Boolean(props.target.item.ownerUid);

  const runSave = async (approveOrCreate: boolean) => {
    setErr(null);
    setSaving(true);
    try {
      await submitReviewDraft(props, draft, approveOrCreate);
      props.onClose();
    } catch (e) {
      setErr(getReadableErrorMessage(e, 'Ma’lumotlarni saqlab bo‘lmadi.'));
    } finally {
      setSaving(false);
    }
  };

  const ownerName = props.target.kind === 'inquiry' ? props.target.item.ownerName : '';
  const smsAsk = `Assalomu alaykum${ownerName ? ' ' + ownerName : ''}! Dasturxon adminiman. MChJ yoki YaTT, biznes turi, manzil, faoliyat va mahsulotlaringizni yuboring.`;

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-3xl border p-6 space-y-3.5 max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <ReviewContactHeader
          title={isInquiry ? 'Murojaatni ko‘rib chiqish' : 'Biznes ma’lumotlarini kiritish'}
          subtitle={`${ownerName ? ownerName + ' · ' : ''}MChJ / YaTT, tur, manzil, faoliyat va mahsulotlar`}
          phone={draft.phone}
          smsBody={smsAsk}
          onClose={props.onClose}
        />
        <ReviewFormInputs draft={draft} onPatch={(u) => setDraft((prev) => ({ ...prev, ...u }))} />
        {err && (
          <div
            className="p-2.5 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: 'var(--dx-error-container)',
              color: 'var(--dx-on-error-container)',
            }}
          >
            {err}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => void runSave(false)}
            className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
            style={{ borderColor: 'var(--dx-border)' }}
          >
            {isInquiry ? 'Javobni saqlash' : 'Saqlash'}
          </button>
          {canApprove && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void runSave(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              {saving ? 'Saqlanmoqda…' : 'Saqlash va Tasdiqlash'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
