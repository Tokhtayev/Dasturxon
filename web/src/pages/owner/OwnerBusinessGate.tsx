import React, { useState } from 'react';
import { Clock, MessageSquareText, PhoneCall, RefreshCw, Send, Store, XCircle } from 'lucide-react';
import { AdminContactModal } from '../../components/AdminContactModal';
import { ADMIN_SUPPORT_PHONE } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import { buildSmsHref, buildTelHref, validateBusinessForm } from '../../services/validators';
import {
  BUSINESS_TYPES,
  LEGAL_FORMS,
  type Business,
  type BusinessTypeKey,
  type LegalFormKey,
  type OwnerInquiry,
  type UserProfile,
} from '../../types/domain';

interface OwnerBusinessGateProps {
  business: Business | null;
  inquiries: OwnerInquiry[];
  ownerProfile: UserProfile | null;
  onCreateBusiness: (params: {
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
    legalForm?: LegalFormKey;
    activitySummary?: string;
    productsSummary?: string;
  }) => Promise<void>;
  onResubmitBusiness: (params: {
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
    legalForm?: LegalFormKey;
    activitySummary?: string;
    productsSummary?: string;
  }) => Promise<void>;
}

const AdminSupportBanner: React.FC<{
  ownerProfile: UserProfile | null;
  inquiries: OwnerInquiry[];
}> = ({ ownerProfile, inquiries }) => {
  const [openModal, setOpenModal] = useState(false);
  const latest = inquiries[0];
  const smsBody = `Assalomu alaykum! Biznes egasi ${ownerProfile?.fullName ?? ''}. MChJ/YaTT, biznes turi va mahsulotlar bo'yicha admin javobini kutmoqdaman.`;

  return (
    <div
      className="rounded-2xl p-4 border space-y-3 text-left"
      style={{
        backgroundColor: 'var(--dx-secondary-container)',
        borderColor: 'var(--dx-secondary)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-extrabold">Admin bilan bog‘lanish va javobni kutish</div>
          <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
            Admin sizdan MChJ/YaTT, manzil, faoliyat va mahsulotlar haqida so‘rab tizimga kiritadi.
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <a
            href={buildTelHref(ADMIN_SUPPORT_PHONE)}
            className="px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <PhoneCall className="w-3.5 h-3.5" style={{ color: 'var(--dx-primary)' }} /> Tel qilish
          </a>
          <a
            href={buildSmsHref(ADMIN_SUPPORT_PHONE, smsBody)}
            className="px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <MessageSquareText className="w-3.5 h-3.5" style={{ color: 'var(--dx-secondary)' }} />{' '}
            SMS yozish
          </a>
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            <Send className="w-3.5 h-3.5" /> Adminga yozish
          </button>
        </div>
      </div>

      {latest && (
        <div
          className="p-3 rounded-xl border text-xs space-y-1"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">
              Murojaat #{latest.id.slice(0, 6).toUpperCase()} ({latest.legalForm.toUpperCase()})
            </span>
            <span
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
              style={{
                backgroundColor:
                  latest.status === 'replied' || latest.status === 'registered'
                    ? 'var(--dx-tertiary-container)'
                    : 'var(--dx-primary-container)',
              }}
            >
              {latest.status === 'replied'
                ? 'Admin javob berdi'
                : latest.status === 'registered'
                  ? 'Biznes kiritildi'
                  : 'Javob kutilmoqda'}
            </span>
          </div>
          {latest.adminReply && (
            <div style={{ color: 'var(--dx-tertiary)' }}>
              <strong>Admin javobi:</strong> {latest.adminReply}
            </div>
          )}
        </div>
      )}

      {openModal && (
        <AdminContactModal
          defaultName={ownerProfile?.fullName ?? ''}
          defaultPhone={ownerProfile?.phone ?? ''}
          defaultEmail={ownerProfile?.email ?? ''}
          ownerUid={ownerProfile?.uid}
          onClose={() => setOpenModal(false)}
        />
      )}
    </div>
  );
};

export const OwnerBusinessGate: React.FC<OwnerBusinessGateProps> = (props) => {
  if (props.business && props.business.status === 'pending') {
    return (
      <PendingBusinessView
        business={props.business}
        inquiries={props.inquiries}
        ownerProfile={props.ownerProfile}
      />
    );
  }
  if (props.business && props.business.status === 'suspended') {
    return <SuspendedBusinessView inquiries={props.inquiries} ownerProfile={props.ownerProfile} />;
  }

  return <BusinessApplicationForm {...props} />;
};

const PendingBusinessView: React.FC<{
  business: Business;
  inquiries: OwnerInquiry[];
  ownerProfile: UserProfile | null;
}> = ({ business, inquiries, ownerProfile }) => (
  <div className="max-w-lg mx-auto py-6 space-y-4">
    <div
      className="rounded-3xl p-7 border text-center space-y-4 shadow-sm"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div
        className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
        style={{
          backgroundColor: 'var(--dx-primary-container)',
          color: 'var(--dx-on-primary-container)',
        }}
      >
        <Clock className="w-8 h-8" />
      </div>
      <h1 className="font-display text-2xl font-extrabold">Biznesingiz ko‘rib chiqilmoqda</h1>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
        <strong>{business.name}</strong> arizasi administratorga yuborildi. Admin ma’lumotlarni
        (MChJ/YaTT, manzil, faoliyat va mahsulotlar) tasdiqlagach, kabinetingiz ochiladi.
      </p>
      <div
        className="p-4 rounded-2xl text-left text-xs space-y-1.5 border"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        {business.legalForm && (
          <div>
            <strong>Shakli:</strong> {business.legalForm.toUpperCase()}
          </div>
        )}
        <div>
          <strong>Tur:</strong>{' '}
          {BUSINESS_TYPES.find((bt) => bt.storedValue === business.type)?.labelUz}
        </div>
        <div>
          <strong>Manzil:</strong> {business.address}
        </div>
        <div>
          <strong>Telefon:</strong> {business.phone}
        </div>
        {business.activitySummary && (
          <div>
            <strong>Faoliyati:</strong> {business.activitySummary}
          </div>
        )}
        {business.productsSummary && (
          <div>
            <strong>Mahsulotlari:</strong> {business.productsSummary}
          </div>
        )}
        {business.adminNote && (
          <div style={{ color: 'var(--dx-tertiary)' }}>
            <strong>Admin izohi:</strong> {business.adminNote}
          </div>
        )}
      </div>
      <AdminSupportBanner ownerProfile={ownerProfile} inquiries={inquiries} />
    </div>
  </div>
);

const SuspendedBusinessView: React.FC<{
  inquiries: OwnerInquiry[];
  ownerProfile: UserProfile | null;
}> = ({ inquiries, ownerProfile }) => (
  <div className="max-w-lg mx-auto py-8 space-y-4">
    <div
      className="rounded-3xl p-7 border text-center space-y-3"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div className="text-4xl">⛔</div>
      <h1 className="font-display text-xl font-bold">Biznes vaqtincha to‘xtatilgan</h1>
      <p className="text-sm" style={{ color: 'var(--dx-muted)' }}>
        Administrator bilan bog‘laning.
      </p>
      <AdminSupportBanner ownerProfile={ownerProfile} inquiries={inquiries} />
    </div>
  </div>
);

const ApplicationHeader: React.FC<{ isRejected: boolean }> = ({ isRejected }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center"
      style={{
        backgroundColor: 'var(--dx-primary-container)',
        color: 'var(--dx-on-primary-container)',
      }}
    >
      {isRejected ? <RefreshCw className="w-5 h-5" /> : <Store className="w-5 h-5" />}
    </div>
    <div>
      <h1 className="font-display text-xl font-extrabold">
        {isRejected ? 'Biznesni qayta yuborish' : 'Biznes profilini yaratish'}
      </h1>
      <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
        MChJ yoki YaTT shakli, manzil, faoliyat va mahsulot ma’lumotlarini kiriting
      </p>
    </div>
  </div>
);

const BusinessApplicationForm: React.FC<OwnerBusinessGateProps> = ({
  business,
  inquiries,
  ownerProfile,
  onCreateBusiness,
  onResubmitBusiness,
}) => {
  const [legalForm, setLegalForm] = useState<LegalFormKey>(business?.legalForm ?? 'yatt');
  const [name, setName] = useState(business?.name ?? '');
  const [type, setType] = useState<BusinessTypeKey>(business?.type ?? 'bakery');
  const [typeNote, setTypeNote] = useState(business?.typeNote ?? '');
  const [address, setAddress] = useState(business?.address ?? '');
  const [phone, setPhone] = useState(business?.phone ?? ownerProfile?.phone ?? '');
  const [activitySummary, setActivitySummary] = useState(business?.activitySummary ?? '');
  const [productsSummary, setProductsSummary] = useState(business?.productsSummary ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRejected = business?.status === 'rejected';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = validateBusinessForm({ name, type, typeNote, address, phone });
    if (!check.valid) return setError(check.error ?? "Ma'lumotlarni tekshiring.");

    setSubmitting(true);
    try {
      const action = isRejected ? onResubmitBusiness : onCreateBusiness;
      await action({
        name,
        type,
        address,
        phone,
        typeNote,
        legalForm,
        activitySummary,
        productsSummary,
      });
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Biznesni saqlab bo‘lmadi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-4 space-y-4">
      <AdminSupportBanner ownerProfile={ownerProfile} inquiries={inquiries} />
      {isRejected && (
        <div
          className="rounded-2xl p-4 border space-y-1"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
            borderColor: 'var(--dx-error)',
          }}
        >
          <div className="font-bold text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" /> Biznes arizasi rad etildi
          </div>
          <p className="text-xs">
            <strong>Sabab:</strong> {business.rejectionReason || "Sabab ko'rsatilmagan."}
          </p>
        </div>
      )}

      <div
        className="rounded-3xl p-6 sm:p-7 border shadow-sm space-y-4"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <ApplicationHeader isRejected={isRejected} />
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <BusinessInputFields
            legalForm={legalForm}
            onLegalFormChange={setLegalForm}
            name={name}
            onNameChange={setName}
            type={type}
            onTypeChange={setType}
            typeNote={typeNote}
            onTypeNoteChange={setTypeNote}
            address={address}
            onAddressChange={setAddress}
            phone={phone}
            onPhoneChange={setPhone}
            activitySummary={activitySummary}
            onActivityChange={setActivitySummary}
            productsSummary={productsSummary}
            onProductsChange={setProductsSummary}
          />
          {error && (
            <div
              role="alert"
              className="p-3 rounded-2xl text-xs font-bold"
              style={{
                backgroundColor: 'var(--dx-error-container)',
                color: 'var(--dx-on-error-container)',
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            {submitting ? 'Yuborilmoqda…' : isRejected ? 'Qayta yuborish' : 'Tasdiqqa yuborish'}
          </button>
        </form>
      </div>
    </div>
  );
};

const BusinessInputFields: React.FC<{
  legalForm: LegalFormKey;
  onLegalFormChange: (v: LegalFormKey) => void;
  name: string;
  onNameChange: (v: string) => void;
  type: BusinessTypeKey;
  onTypeChange: (v: BusinessTypeKey) => void;
  typeNote: string;
  onTypeNoteChange: (v: string) => void;
  address: string;
  onAddressChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  activitySummary: string;
  onActivityChange: (v: string) => void;
  productsSummary: string;
  onProductsChange: (v: string) => void;
}> = (p) => (
  <>
    <div>
      <div className="text-xs font-bold mb-1">Tashkiliy-huquqiy shakli</div>
      <div className="grid grid-cols-2 gap-2">
        {LEGAL_FORMS.map((lf) => (
          <button
            key={lf.storedValue}
            type="button"
            onClick={() => p.onLegalFormChange(lf.storedValue)}
            className="p-2.5 rounded-2xl border text-left cursor-pointer"
            style={{
              backgroundColor:
                p.legalForm === lf.storedValue ? 'var(--dx-secondary-container)' : 'var(--dx-bg)',
              borderColor:
                p.legalForm === lf.storedValue ? 'var(--dx-secondary)' : 'var(--dx-border)',
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
    <input
      value={p.name}
      onChange={(e) => p.onNameChange(e.target.value)}
      placeholder="Biznes nomi (Masalan: Gulzor Patir Nonvoyxonasi)"
      className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <select
      value={p.type}
      onChange={(e) => p.onTypeChange(e.target.value as BusinessTypeKey)}
      className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    >
      {BUSINESS_TYPES.map((bt) => (
        <option key={bt.storedValue} value={bt.storedValue}>
          {bt.icon} {bt.labelUz}
        </option>
      ))}
    </select>
    {p.type === 'other' && (
      <input
        value={p.typeNote}
        maxLength={40}
        onChange={(e) => p.onTypeNoteChange(e.target.value)}
        placeholder="Boshqa turi uchun izoh (3–40 belgi)"
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    )}
    <input
      value={p.address}
      onChange={(e) => p.onAddressChange(e.target.value)}
      placeholder="Manzil (Yunusobod tumani, 4-mavze, 12-uy)"
      className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <input
      type="tel"
      value={p.phone}
      onChange={(e) => p.onPhoneChange(e.target.value)}
      placeholder="Telefon (+998 90 123 45 67)"
      className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <textarea
      rows={2}
      value={p.activitySummary}
      onChange={(e) => p.onActivityChange(e.target.value)}
      placeholder="Faoliyati haqida qisqacha ma’lumot (ixtiyoriy)"
      className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <textarea
      rows={2}
      value={p.productsSummary}
      onChange={(e) => p.onProductsChange(e.target.value)}
      placeholder="Asosiy mahsulotlari haqida qisqacha (ixtiyoriy)"
      className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
  </>
);
