import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getReadableErrorMessage } from '../../services/errors';
import { validateBusinessForm } from '../../services/validators';
import { BUSINESS_TYPES, type Business, type BusinessTypeKey } from '../../types/domain';

interface BusinessEditModalProps {
  business: Business;
  onClose: () => void;
  onSave: (params: {
    name: string;
    type: BusinessTypeKey;
    address: string;
    phone: string;
    typeNote?: string;
  }) => Promise<void>;
}

export const BusinessEditModal: React.FC<BusinessEditModalProps> = ({
  business,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(business.name);
  const [type, setType] = useState<BusinessTypeKey>(business.type);
  const [typeNote, setTypeNote] = useState(business.typeNote ?? '');
  const [address, setAddress] = useState(business.address);
  const [phone, setPhone] = useState(business.phone);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    const check = validateBusinessForm({ name, type, typeNote, address, phone });
    if (!check.valid) {
      setFormErr(check.error ?? "Ma'lumotlarni tekshiring.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ name, type, address, phone, typeNote });
      onClose();
    } catch (err) {
      setFormErr(getReadableErrorMessage(err, "Biznes ma'lumotlarini saqlab bo'lmadi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border p-6 space-y-3.5"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Biznes ma’lumotlari</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Biznes nomi"
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BusinessTypeKey)}
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        >
          {BUSINESS_TYPES.map((bt) => (
            <option key={bt.storedValue} value={bt.storedValue}>
              {bt.icon} {bt.labelUz}
            </option>
          ))}
        </select>
        {type === 'other' && (
          <input
            value={typeNote}
            onChange={(e) => setTypeNote(e.target.value)}
            placeholder="Boshqa tur izohi (3-40 belgi)"
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          />
        )}
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Manzil"
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefon"
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        {formErr && (
          <div className="text-xs font-bold" style={{ color: 'var(--dx-error)' }}>
            {formErr}
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
};
