import React, { useState } from 'react';
import { Clock, RefreshCw, Store, XCircle } from 'lucide-react';
import { getReadableErrorMessage } from '../../services/errors';
import { validateBusinessForm } from '../../services/validators';
import { BUSINESS_TYPES, type Business, type BusinessTypeKey } from '../../types/domain';

interface OwnerBusinessGateProps {
  business: Business | null;
  onCreateBusiness: (params: {
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
  }) => Promise<void>;
  onResubmitBusiness: (params: {
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
  }) => Promise<void>;
}

export const OwnerBusinessGate: React.FC<OwnerBusinessGateProps> = ({
  business,
  onCreateBusiness,
  onResubmitBusiness,
}) => {
  if (business && business.status === 'pending') return <PendingBusinessView business={business} />;
  if (business && business.status === 'suspended') return <SuspendedBusinessView />;

  return (
    <BusinessApplicationForm
      business={business}
      onCreateBusiness={onCreateBusiness}
      onResubmitBusiness={onResubmitBusiness}
    />
  );
};

const PendingBusinessView: React.FC<{ business: Business }> = ({ business }) => (
  <div className="max-w-lg mx-auto py-8">
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
        <strong>{business.name}</strong> arizasi administratorga yuborildi. Tasdiqlangandan so‘ng
        mahsulot qo‘shish, buyurtmalarni boshqarish va analitika paneli avtomatik ochiladi.
      </p>
      <div
        className="p-4 rounded-2xl text-left text-xs space-y-1 border"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
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
      </div>
    </div>
  </div>
);

const SuspendedBusinessView: React.FC = () => (
  <div className="max-w-lg mx-auto py-8">
    <div
      className="rounded-3xl p-7 border text-center space-y-3"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div className="text-4xl">⛔</div>
      <h1 className="font-display text-xl font-bold">Biznes vaqtincha to‘xtatilgan</h1>
      <p className="text-sm" style={{ color: 'var(--dx-muted)' }}>
        Administrator bilan bog‘laning.
      </p>
    </div>
  </div>
);

const BusinessApplicationForm: React.FC<OwnerBusinessGateProps> = ({
  business,
  onCreateBusiness,
  onResubmitBusiness,
}) => {
  const [name, setName] = useState(business?.name ?? '');
  const [type, setType] = useState<BusinessTypeKey>(business?.type ?? 'bakery');
  const [typeNote, setTypeNote] = useState(business?.typeNote ?? '');
  const [address, setAddress] = useState(business?.address ?? '');
  const [phone, setPhone] = useState(business?.phone ?? '');
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
      await action({ name, type, address, phone, typeNote });
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Biznesni saqlab bo‘lmadi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-4 space-y-5">
      {isRejected && (
        <div
          className="rounded-2xl p-4 border space-y-1.5"
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
          <p className="text-xs opacity-85">
            Ma’lumotlarni tuzatib qayta tasdiqqa yuborishingiz mumkin.
          </p>
        </div>
      )}

      <div
        className="rounded-3xl p-6 sm:p-7 border shadow-sm space-y-5"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
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
              Administrator tasdiqlagandan so‘ng mijozlar do‘koningizni ko‘radi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <BusinessInputFields
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
            {submitting
              ? 'Yuborilmoqda…'
              : isRejected
                ? 'Qayta tasdiqqa yuborish'
                : 'Tasdiqqa yuborish'}
          </button>
        </form>
      </div>
    </div>
  );
};

const BusinessInputFields: React.FC<{
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
}> = ({
  name,
  onNameChange,
  type,
  onTypeChange,
  typeNote,
  onTypeNoteChange,
  address,
  onAddressChange,
  phone,
  onPhoneChange,
}) => (
  <>
    <div className="space-y-1">
      <label htmlFor="biz-name" className="text-xs font-bold block">
        Biznes nomi
      </label>
      <input
        id="biz-name"
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Masalan: Baraka novvoyxonasi"
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
    <div className="space-y-1">
      <label htmlFor="biz-type" className="text-xs font-bold block">
        Biznes turi
      </label>
      <select
        id="biz-type"
        value={type}
        onChange={(e) => onTypeChange(e.target.value as BusinessTypeKey)}
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        {BUSINESS_TYPES.map((bt) => (
          <option key={bt.storedValue} value={bt.storedValue}>
            {bt.icon} {bt.labelUz}
          </option>
        ))}
      </select>
    </div>
    {type === 'other' && (
      <div className="space-y-1">
        <label htmlFor="biz-note" className="text-xs font-bold block">
          Boshqa turi uchun izoh (3–40 belgi)
        </label>
        <input
          id="biz-note"
          type="text"
          value={typeNote}
          maxLength={40}
          onChange={(e) => onTypeNoteChange(e.target.value)}
          placeholder="Masalan: Milliy sut mahsulotlari"
          className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
    )}
    <div className="space-y-1">
      <label htmlFor="biz-addr" className="text-xs font-bold block">
        Manzil
      </label>
      <input
        id="biz-addr"
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Yunusobod tumani, 4-mavze, 12-uy"
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
    <div className="space-y-1">
      <label htmlFor="biz-phone" className="text-xs font-bold block">
        Telefon
      </label>
      <input
        id="biz-phone"
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="+998 90 123 45 67"
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
  </>
);
