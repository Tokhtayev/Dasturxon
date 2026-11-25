import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ShoppingBag, Store } from 'lucide-react';
import { DxLogo } from '../components/DxLogo';
import { useAuth } from '../hooks/useAuth';
import { getReadableErrorMessage } from '../services/errors';
import { validateSignUpForm } from '../services/validators';
import type { RegisterableRole } from '../types/domain';

export const RegisterPage: React.FC = () => {
  const { signUp, firebaseReady } = useAuth();
  const [role, setRole] = useState<RegisterableRole>('customer');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = validateSignUpForm({ fullName, nickname, email, password, confirmPassword });
    if (!check.valid) return setError(check.error ?? "Ma'lumotlarni tekshiring.");
    if (!firebaseReady) return setError('Firebase Web SDK sozlanmagan (.env faylini tekshiring).');

    setSubmitting(true);
    try {
      await signUp({ fullName, nickname, email, password, role, phone });
    } catch (err) {
      setError(getReadableErrorMessage(err, "Ro'yxatdan o'tishda xatolik yuz berdi."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 dx-pattern-bg">
      <div className="w-full max-w-md space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold"
          style={{ color: 'var(--dx-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <div
          className="rounded-3xl p-6 sm:p-8 border shadow-xl space-y-5"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <DxLogo size={42} showWordmark={false} />
            </div>
            <h1 className="font-display text-2xl font-extrabold">Ro‘yxatdan o‘tish</h1>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--dx-muted)' }}>
              O‘zingizga mos rolni tanlang (Admin roli faqat Firebase Console orqali beriladi)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RoleSelector role={role} onChange={setRole} />
            <ProfileFields
              fullName={fullName}
              onFullNameChange={setFullName}
              nickname={nickname}
              onNicknameChange={setNickname}
              phone={phone}
              onPhoneChange={setPhone}
              email={email}
              onEmailChange={setEmail}
            />
            <PasswordFields
              password={password}
              onPasswordChange={setPassword}
              confirmPassword={confirmPassword}
              onConfirmChange={setConfirmPassword}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
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
              {submitting ? 'Yaratilmoqda…' : 'Hisob yaratish'}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: 'var(--dx-muted)' }}>
            Allaqachon hisobingiz bormi?{' '}
            <Link
              to="/login"
              className="font-bold underline"
              style={{ color: 'var(--dx-primary)' }}
            >
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const RoleSelector: React.FC<{
  role: RegisterableRole;
  onChange: (r: RegisterableRole) => void;
}> = ({ role, onChange }) => (
  <div className="grid grid-cols-2 gap-2.5">
    <button
      type="button"
      onClick={() => onChange('customer')}
      className="p-3 rounded-2xl border text-left space-y-1 cursor-pointer transition-colors"
      style={{
        backgroundColor: role === 'customer' ? 'var(--dx-primary-container)' : 'var(--dx-bg)',
        borderColor: role === 'customer' ? 'var(--dx-primary)' : 'var(--dx-border)',
      }}
    >
      <ShoppingBag className="w-4 h-4" style={{ color: 'var(--dx-primary)' }} />
      <div className="text-xs font-extrabold">Xaridor</div>
      <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
        Buyurtma berish
      </div>
    </button>

    <button
      type="button"
      onClick={() => onChange('owner')}
      className="p-3 rounded-2xl border text-left space-y-1 cursor-pointer transition-colors"
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

const ProfileFields: React.FC<{
  fullName: string;
  onFullNameChange: (v: string) => void;
  nickname: string;
  onNicknameChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
}> = ({
  fullName,
  onFullNameChange,
  nickname,
  onNicknameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
}) => (
  <>
    <div className="space-y-1">
      <label htmlFor="reg-fullname" className="text-xs font-bold block">
        To‘liq ism
      </label>
      <input
        id="reg-fullname"
        type="text"
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
        placeholder="Masalan: Azizbek Karimov"
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label htmlFor="reg-nick" className="text-xs font-bold block">
          Nickname (unikal)
        </label>
        <input
          id="reg-nick"
          type="text"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          placeholder="azizbek_01"
          className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="reg-phone" className="text-xs font-bold block">
          Telefon (ixtiyoriy)
        </label>
        <input
          id="reg-phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+998 90 123 45 67"
          className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
    </div>
    <div className="space-y-1">
      <label htmlFor="reg-email" className="text-xs font-bold block">
        Email manzil
      </label>
      <input
        id="reg-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="azizbek@gmail.com"
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
  </>
);

const PasswordFields: React.FC<{
  password: string;
  onPasswordChange: (v: string) => void;
  confirmPassword: string;
  onConfirmChange: (v: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}> = ({
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmChange,
  showPassword,
  onToggleShow,
}) => (
  <>
    <div className="space-y-1">
      <label htmlFor="reg-password" className="text-xs font-bold block">
        Parol (kamida 8 belgi, harf + raqam)
      </label>
      <div className="relative">
        <input
          id="reg-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          className="w-full pl-3.5 pr-11 py-2.5 rounded-2xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
          style={{ color: 'var(--dx-muted)' }}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
    <div className="space-y-1">
      <label htmlFor="reg-confirm" className="text-xs font-bold block">
        Parolni tasdiqlang
      </label>
      <input
        id="reg-confirm"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => onConfirmChange(e.target.value)}
        placeholder="••••••••"
        className="w-full px-3.5 py-2.5 rounded-2xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      />
    </div>
  </>
);
