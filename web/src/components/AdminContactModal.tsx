import React, { useState } from 'react';
import { CheckCircle2, MessageSquareText, PhoneCall, Send, X } from 'lucide-react';
import { inquiryRepository } from '../repositories/inquiryRepository';
import { ADMIN_SUPPORT_PHONE } from '../services/constants';
import { getReadableErrorMessage } from '../services/errors';
import { buildSmsHref, buildTelHref, validateOwnerInquiry } from '../services/validators';
import {
  BUSINESS_TYPES,
  LEGAL_FORMS,
  type BusinessTypeKey,
  type LegalFormKey,
} from '../types/domain';

interface AdminContactModalProps {
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  ownerUid?: string;
  onClose: () => void;
}

const InquiryContactStrip: React.FC<{ smsText: string }> = ({ smsText }) => (
  <div className="grid grid-cols-2 gap-2">
    <a
      href={buildTelHref(ADMIN_SUPPORT_PHONE)}
      className="px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    >
      <PhoneCall className="w-3.5 h-3.5" style={{ color: 'var(--dx-primary)' }} /> Tel qilish
    </a>
    <a
      href={buildSmsHref(ADMIN_SUPPORT_PHONE, smsText)}
      className="px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    >
      <MessageSquareText className="w-3.5 h-3.5" style={{ color: 'var(--dx-secondary)' }} /> SMS
      yozish
    </a>
  </div>
);

const InquirySuccessCard: React.FC<{
  inquiryId: string;
  phone: string;
  onClose: () => void;
}> = ({ inquiryId, phone, onClose }) => (
  <div className="text-center space-y-4 py-2">
    <div
      className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
      style={{
        backgroundColor: 'var(--dx-tertiary-container)',
        color: 'var(--dx-on-tertiary-container)',
      }}
    >
      <CheckCircle2 className="w-7 h-7" />
    </div>
    <h3 className="font-display text-lg font-extrabold">Murojaatingiz yuborildi!</h3>
    <p className="text-xs leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
      Ariza raqami: <strong>#{inquiryId.slice(0, 6).toUpperCase()}</strong>. Administrator{' '}
      <strong>{phone}</strong> raqamingizga qo‘ng‘iroq/SMS qiladi yoki hisobingizga kirsangiz
      javobni real vaqtda ko‘rasiz.
    </p>
    <div className="flex flex-wrap gap-2 justify-center">
      <a
        href={buildTelHref(ADMIN_SUPPORT_PHONE)}
        className="px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        <PhoneCall className="w-3.5 h-3.5" /> Hozir qo‘ng‘iroq qilish
      </a>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
        style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
      >
        Tushunarli
      </button>
    </div>
  </div>
);

const InquiryFields: React.FC<{
  ownerName: string;
  onNameChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  legalForm: LegalFormKey;
  onLegalFormChange: (v: LegalFormKey) => void;
  businessName: string;
  onBizNameChange: (v: string) => void;
  businessType: BusinessTypeKey;
  onBizTypeChange: (v: BusinessTypeKey) => void;
  address: string;
  onAddressChange: (v: string) => void;
  activitySummary: string;
  onActivityChange: (v: string) => void;
  productsSummary: string;
  onProductsChange: (v: string) => void;
}> = (p) => (
  <div className="space-y-2.5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <input
        value={p.ownerName}
        onChange={(e) => p.onNameChange(e.target.value)}
        placeholder="Ismingiz (masalan: Azizbek)"
        className="w-full px-3.5 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
      <input
        type="tel"
        value={p.phone}
        onChange={(e) => p.onPhoneChange(e.target.value)}
        placeholder="Telefon (+998 90 123 45 67)"
        className="w-full px-3.5 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
    <div>
      <div className="text-[11px] font-bold mb-1">Tashkiliy-huquqiy shakli *</div>
      <div className="grid grid-cols-2 gap-2">
        {LEGAL_FORMS.map((lf) => {
          const active = p.legalForm === lf.storedValue;
          return (
            <button
              key={lf.storedValue}
              type="button"
              onClick={() => p.onLegalFormChange(lf.storedValue)}
              className="p-2 rounded-xl border text-left cursor-pointer"
              style={{
                backgroundColor: active ? 'var(--dx-secondary-container)' : 'var(--dx-bg)',
                borderColor: active ? 'var(--dx-secondary)' : 'var(--dx-border)',
              }}
            >
              <div className="text-xs font-extrabold">{lf.labelUz}</div>
              <div className="text-[10px]" style={{ color: 'var(--dx-muted)' }}>
                {lf.hint}
              </div>
            </button>
          );
        })}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <input
        value={p.businessName}
        onChange={(e) => p.onBizNameChange(e.target.value)}
        placeholder="Do‘kon nomi (ixtiyoriy)"
        className="w-full px-3.5 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
      <select
        value={p.businessType}
        onChange={(e) => p.onBizTypeChange(e.target.value as BusinessTypeKey)}
        className="w-full px-3.5 py-2 rounded-xl border text-xs"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        {BUSINESS_TYPES.map((bt) => (
          <option key={bt.storedValue} value={bt.storedValue}>
            {bt.icon} {bt.labelUz}
          </option>
        ))}
      </select>
    </div>
    <input
      value={p.address}
      onChange={(e) => p.onAddressChange(e.target.value)}
      placeholder="Manzil (tuman, ko‘cha, mo‘ljal)"
      className="w-full px-3.5 py-2 rounded-xl border text-xs"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <textarea
      rows={2}
      value={p.activitySummary}
      onChange={(e) => p.onActivityChange(e.target.value)}
      placeholder="Faoliyati haqida qisqacha (masalan: har kuni issiq non va somsa pishirish)"
      className="w-full px-3.5 py-2 rounded-xl border text-xs"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <textarea
      rows={2}
      value={p.productsSummary}
      onChange={(e) => p.onProductsChange(e.target.value)}
      placeholder="Mahsulotlari (masalan: Tandir non 5 000, Patir 14 000, Go‘shtli somsa 9 000)"
      className="w-full px-3.5 py-2 rounded-xl border text-xs"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
  </div>
);

export const AdminContactModal: React.FC<AdminContactModalProps> = ({
  defaultName = '',
  defaultPhone = '',
  defaultEmail = '',
  ownerUid,
  onClose,
}) => {
  const [ownerName, setOwnerName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone || '+998 ');
  const [legalForm, setLegalForm] = useState<LegalFormKey>('yatt');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessTypeKey>('bakery');
  const [address, setAddress] = useState('');
  const [activitySummary, setActivitySummary] = useState('');
  const [productsSummary, setProductsSummary] = useState('');
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const smsText = `Assalomu alaykum! Dasturxon platformasiga biznes ulamoqchiman (${legalForm.toUpperCase()}). Ismim: ${ownerName || '...'}, manzil: ${address || '...'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = validateOwnerInquiry({
      ownerName,
      phone,
      legalForm,
      activitySummary,
      productsSummary,
    });
    if (!check.valid) return setError(check.error ?? 'Ma’lumotlarni tekshiring.');

    setSending(true);
    try {
      const id = await inquiryRepository.createInquiry({
        ownerName,
        phone,
        email: defaultEmail,
        ownerUid,
        legalForm,
        businessType,
        businessName,
        address,
        activitySummary,
        productsSummary,
      });
      setSentId(id);
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Murojaatni yuborib bo‘lmadi.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl border p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">Admin bilan bog‘lanish</h2>
            <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
              Tel, SMS yoki tizim orqali biznes ma’lumotlarini yuboring
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <InquiryContactStrip smsText={smsText} />

        {sentId ? (
          <InquirySuccessCard inquiryId={sentId} phone={phone} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <InquiryFields
              ownerName={ownerName}
              onNameChange={setOwnerName}
              phone={phone}
              onPhoneChange={setPhone}
              legalForm={legalForm}
              onLegalFormChange={setLegalForm}
              businessName={businessName}
              onBizNameChange={setBusinessName}
              businessType={businessType}
              onBizTypeChange={setBusinessType}
              address={address}
              onAddressChange={setAddress}
              activitySummary={activitySummary}
              onActivityChange={setActivitySummary}
              productsSummary={productsSummary}
              onProductsChange={setProductsSummary}
            />
            {error && (
              <div
                className="p-2.5 rounded-xl text-xs font-bold"
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
              disabled={sending}
              className="w-full py-3 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              <Send className="w-3.5 h-3.5" />{' '}
              {sending ? 'Yuborilmoqda…' : 'Adminga yuborish va javobni kutish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
