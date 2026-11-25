import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { DxLogo } from '../components/DxLogo';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail } from '../services/validators';

export const LoginPage: React.FC = () => {
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

    if (!isValidEmail(email)) {
      setError("To'g'ri email manzilini kiriting.");
      return;
    }
    if (!password) {
      setError('Parolni kiriting.');
      return;
    }
    if (!firebaseReady) {
      setError('Firebase Web SDK sozlanmagan (.env faylini tekshiring).');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kirishda xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetMessage(null);
    if (!isValidEmail(email)) {
      setError("Parolni tiklash uchun avval email manzilingizni kiriting.");
      return;
    }
    try {
      await resetPassword(email);
      setResetMessage(
        'Agar ushbu email tizimda mavjud bo‘lsa, parolni tiklash havolasi yuborildi.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tiklash xati yuborilmadi.');
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
          className="rounded-3xl p-6 sm:p-8 border shadow-xl space-y-6"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <DxLogo size={44} showWordmark={false} />
            </div>
            <h1 className="font-display text-2xl font-extrabold">Xush kelibsiz!</h1>
            <p className="text-sm" style={{ color: 'var(--dx-muted)' }}>
              Dasturxon hisobingizga email va parol bilan kiring
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
                onClick={() => void handleForgotPassword()}
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

          <p className="text-center text-xs" style={{ color: 'var(--dx-muted)' }}>
            Hisobingiz yo‘qmi?{' '}
            <Link to="/register" className="font-bold underline" style={{ color: 'var(--dx-primary)' }}>
              Ro‘yxatdan o‘tish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
