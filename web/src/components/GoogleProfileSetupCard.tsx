import React, { useState } from 'react';
import { ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getReadableErrorMessage } from '../services/errors';
import { deriveNicknameCandidates } from '../services/validators';
import type { RegisterableRole } from '../types/domain';
import { DxLogo } from './DxLogo';

interface GoogleProfileSetupCardProps {
  uid: string;
  email: string;
  displayName?: string;
}

export const GoogleProfileSetupCard: React.FC<GoogleProfileSetupCardProps> = ({
  uid,
  email,
  displayName,
}) => {
  const { completeGoogleProfile, signOut } = useAuth();
  const [role, setRole] = useState<RegisterableRole>('customer');
  const [fullName, setFullName] = useState(
    displayName?.trim() || email.split('@')[0] || 'Foydalanuvchi'
  );
  const [nickname, setNickname] = useState(
    () => deriveNicknameCandidates(email, uid)[0] ?? 'dasturxon_user'
  );
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await completeGoogleProfile({ fullName, nickname, role, phone });
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Profilni saqlashda xatolik yuz berdi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dx-pattern-bg">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full rounded-3xl p-6 sm:p-7 border shadow-xl space-y-4"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <DxLogo size={40} showWordmark={false} />
          </div>
          <h2 className="font-display text-xl font-extrabold">Rolni tanlang</h2>
          <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
            Google orqali kirdingiz: <strong>{email}</strong>
          </p>
        </div>

        <RolePickGrid role={role} onChange={setRole} />

        <GoogleSetupFields
          role={role}
          fullName={fullName}
          onFullNameChange={setFullName}
          nickname={nickname}
          onNicknameChange={setNickname}
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
          className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          {submitting
            ? 'Saqlanmoqda…'
            : role === 'owner'
              ? 'Biznes egasi sifatida kirish'
              : 'Mijoz sifatida kirish'}
        </button>

        <button
          type="button"
          onClick={() => void signOut()}
          className="w-full py-2.5 rounded-2xl border text-xs font-bold cursor-pointer"
          style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-muted)' }}
        >
          Boshqa hisob bilan kirish
        </button>
      </form>
    </div>
  );
};

const GoogleSetupFields: React.FC<{
  role: RegisterableRole;
  fullName: string;
  onFullNameChange: (v: string) => void;
  nickname: string;
  onNicknameChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
}> = ({ role, fullName, onFullNameChange, nickname, onNicknameChange, phone, onPhoneChange }) => (
  <>
    <div className="space-y-1">
      <label htmlFor="gp-name" className="text-xs font-bold block">
        To‘liq ism
      </label>
      <input
        id="gp-name"
        type="text"
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label htmlFor="gp-nick" className="text-xs font-bold block">
          Nickname (unikal)
        </label>
        <input
          id="gp-nick"
          type="text"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="gp-phone" className="text-xs font-bold block">
          {role === 'owner' ? 'Telefon (majburiy)' : 'Telefon (ixtiyoriy)'}
        </label>
        <input
          id="gp-phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+998 90 123 45 67"
          className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
    </div>
  </>
);

const RolePickGrid: React.FC<{
  role: RegisterableRole;
  onChange: (r: RegisterableRole) => void;
}> = ({ role, onChange }) => (
  <div className="grid grid-cols-2 gap-2.5">
    <button
      type="button"
      onClick={() => onChange('customer')}
      className="p-3 rounded-2xl border text-left space-y-1 cursor-pointer"
      style={{
        backgroundColor: role === 'customer' ? 'var(--dx-primary-container)' : 'var(--dx-bg)',
        borderColor: role === 'customer' ? 'var(--dx-primary)' : 'var(--dx-border)',
      }}
    >
      <ShoppingBag className="w-4 h-4" style={{ color: 'var(--dx-primary)' }} />
      <div className="text-xs font-extrabold">Mijoz</div>
      <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
        Buyurtma berish
      </div>
    </button>
    <button
      type="button"
      onClick={() => onChange('owner')}
      className="p-3 rounded-2xl border text-left space-y-1 cursor-pointer"
      style={{
        backgroundColor: role === 'owner' ? 'var(--dx-secondary-container)' : 'var(--dx-bg)',
        borderColor: role === 'owner' ? 'var(--dx-secondary)' : 'var(--dx-border)',
      }}
    >
      <Store className="w-4 h-4" style={{ color: 'var(--dx-secondary)' }} />
      <div className="text-xs font-extrabold">Biznes egasi</div>
      <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
        Do‘kon boshqarish
      </div>
    </button>
  </div>
);
