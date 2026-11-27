import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageSquareText,
  PhoneCall,
  Send,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { AdminContactModal } from '../components/AdminContactModal';
import { DxLogo } from '../components/DxLogo';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_SUPPORT_PHONE } from '../services/constants';
import { getReadableErrorMessage } from '../services/errors';
import {
  buildSmsHref,
  buildTelHref,
  isValidContactPhone,
  isValidEmail,
  validateSignUpForm,
} from '../services/validators';
import type { RegisterableRole } from '../types/domain';

type AuthTab = 'login' | 'register';

export const LoginPage: React.FC<{ initialTab?: AuthTab }> = ({ initialTab = 'login' }) => {
  const [tab, setTab] = useState<AuthTab>(initialTab);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 dx-pattern-bg">
      <div className="w-full max-w-md space-y-4">
        <div
          className="rounded-3xl p-6 sm:p-8 border shadow-xl space-y-5"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <DxLogo size={46} showWordmark={false} />
            </div>
            <h1 className="font-display text-2xl font-extrabold">Dasturxon — Mahalla Bozori</h1>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--dx-muted)' }}>
              {tab === 'login'
                ? 'Hisobingizga email va parol bilan kiring'
                : 'Yangi hisob yaratish uchun rolingizni tanlang'}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Autentifikatsiya"
            className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          >
            {(
              [
                ['login', 'Kirish'],
                ['register', "Ro'yxatdan o'tish"],
              ] as const
            ).map(([key, label]) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className="py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--dx-primary)' : 'transparent',
                    color: active ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {tab === 'login' ? <LoginTabPanel /> : <RegisterTabPanel />}
        </div>
      </div>
    </div>
  );
};

const LoginTabPanel: React.FC = () => {
  const { signIn, resetPassword, firebaseReady } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    if (!isValidEmail(email)) return setError("To'g'ri email manzilini kiriting.");
    if (!password) return setError('Parolni kiriting.');
    if (!firebaseReady) return setError('Firebase Web SDK sozlanmagan (.env faylini tekshiring).');

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Kirishda xatolik yuz berdi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetMessage(null);
    if (!isValidEmail(email)) {
      setError('Parolni tiklash uchun avval email manzilingizni kiriting.');
      return;
    }
    try {
      await resetPassword(email);
      setResetMessage(
        'Agar ushbu email tizimda mavjud bo‘lsa, parolni tiklash havolasi yuborildi.'
      );
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Tiklash xati yuborilmadi.'));
    }
  };

  return (
    <LoginForm
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      submitting={submitting}
      error={error}
      resetMessage={resetMessage}
      onForgotPassword={() => void handleForgotPassword()}
      onSubmit={handleSubmit}
    />
  );
};

const OwnerAdminHelpBox: React.FC<{ onOpenInquiry: () => void }> = ({ onOpenInquiry }) => {
  const smsBody =
    "Assalomu alaykum! Dasturxon platformasida biznes egasi sifatida ro'yxatdan o'tmoqchiman (MChJ / YaTT). Ma'lumot berishga tayyorman.";
  return (
    <div
      className="rounded-2xl p-3.5 border space-y-2.5"
      style={{
        backgroundColor: 'var(--dx-secondary-container)',
        borderColor: 'var(--dx-secondary)',
      }}
    >
      <div>
        <div
          className="text-xs font-extrabold"
          style={{ color: 'var(--dx-on-secondary-container)' }}
        >
          Administrator bilan bog‘lanish (Biznes ulash)
        </div>
        <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--dx-muted)' }}>
          Admin sizdan <strong>MChJ yoki YaTT</strong>, biznes turi, manzil va mahsulotlaringizni
          so‘rab tizimga kiritadi:
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <a
          href={buildTelHref(ADMIN_SUPPORT_PHONE)}
          className="px-2 py-1.5 rounded-xl border text-[11px] font-bold inline-flex items-center justify-center gap-1"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <PhoneCall className="w-3 h-3" style={{ color: 'var(--dx-primary)' }} /> Tel qilish
        </a>
        <a
          href={buildSmsHref(ADMIN_SUPPORT_PHONE, smsBody)}
          className="px-2 py-1.5 rounded-xl border text-[11px] font-bold inline-flex items-center justify-center gap-1"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <MessageSquareText className="w-3 h-3" style={{ color: 'var(--dx-secondary)' }} /> SMS
        </a>
        <button
          type="button"
          onClick={onOpenInquiry}
          className="px-2 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          <Send className="w-3 h-3" /> So‘rov
        </button>
      </div>
    </div>
  );
};

const RegisterTabPanel: React.FC = () => {
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
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = validateSignUpForm({ fullName, nickname, email, password, confirmPassword });
    if (!check.valid) return setError(check.error ?? "Ma'lumotlarni tekshiring.");
    if (role === 'owner' && !isValidContactPhone(phone)) {
      return setError("Biznes egasi uchun admin bog'lanadigan telefon raqami majburiy.");
    }
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
    <>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <RoleSelector role={role} onChange={setRole} />
        {role === 'owner' ? (
          <OwnerAdminHelpBox onOpenInquiry={() => setContactModalOpen(true)} />
        ) : (
          <p className="text-[11px] text-center" style={{ color: 'var(--dx-muted)' }}>
            Admin roli faqat Firebase Console orqali tayinlanadi
          </p>
        )}
        <ProfileFields
          fullName={fullName}
          onFullNameChange={setFullName}
          nickname={nickname}
          onNicknameChange={setNickname}
          phone={phone}
          onPhoneChange={setPhone}
          phoneRequired={role === 'owner'}
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
          {submitting ? 'Yaratilmoqda…' : "Ro'yxatdan o'tish"}
        </button>
      </form>
      {contactModalOpen && (
        <AdminContactModal
          defaultName={fullName}
          defaultPhone={phone}
          defaultEmail={email}
          onClose={() => setContactModalOpen(false)}
        />
      )}
    </>
  );
};

const LoginForm: React.FC<{
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  submitting: boolean;
  error: string | null;
  resetMessage: string | null;
  onForgotPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}> = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  submitting,
  error,
  resetMessage,
  onForgotPassword,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-1.5">
      <label htmlFor="login-email" className="text-xs font-bold block">
        Email manzil
      </label>
      <div className="relative">
        <Mail
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--dx-muted)' }}
        />
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="foydalanuvchi@gmail.com"
          className="w-full pl-10 pr-3.5 py-3 rounded-2xl border text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
    </div>

    <div className="space-y-1.5">
      <label htmlFor="login-password" className="text-xs font-bold block">
        Parol
      </label>
      <div className="relative">
        <Lock
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--dx-muted)' }}
        />
        <input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          className="w-full pl-10 pr-11 py-3 rounded-2xl border text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
          style={{ color: 'var(--dx-muted)' }}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>

    <div className="flex justify-end">
      <button
        type="button"
        onClick={onForgotPassword}
        className="text-xs font-bold cursor-pointer hover:underline"
        style={{ color: 'var(--dx-secondary)' }}
      >
        Parolni unutdingizmi?
      </button>
    </div>

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

    {resetMessage && (
      <div
        className="p-3 rounded-2xl text-xs font-bold"
        style={{
          backgroundColor: 'var(--dx-tertiary-container)',
          color: 'var(--dx-on-tertiary-container)',
        }}
      >
        {resetMessage}
      </div>
    )}

    <button
      type="submit"
      disabled={submitting}
      className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
      style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
    >
      {submitting ? 'Kirilmoqda…' : 'Kirish'}
    </button>
  </form>
);

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
      <div className="text-xs font-extrabold">Mijoz</div>
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
  phoneRequired: boolean;
  email: string;
  onEmailChange: (v: string) => void;
}> = ({
  fullName,
  onFullNameChange,
  nickname,
  onNicknameChange,
  phone,
  onPhoneChange,
  phoneRequired,
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
          {phoneRequired ? 'Telefon (majburiy)' : 'Telefon (ixtiyoriy)'}
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
