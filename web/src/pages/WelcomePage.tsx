import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Moon, ShieldCheck, ShoppingBag, Store, Sun } from 'lucide-react';
import { DxLogo } from '../components/DxLogo';
import { useAuth } from '../hooks/useAuth';

interface WelcomePageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const FEATURE_CARDS = [
  {
    icon: ShoppingBag,
    title: 'Xaridor kabineti',
    desc: 'Toifa filtri, qidiruv, real vaqt zaxira tranzaksiyasi, olib ketish yoki yetkazib berish hamda buyurtmalar tarixi.',
    bg: 'var(--dx-primary-container)',
    fg: 'var(--dx-on-primary-container)',
  },
  {
    icon: BarChart3,
    title: 'Biznes egasi paneli',
    desc: 'Mahsulot CRUD, maxfiy tannarx, xarajatlar hisobi hamda kunlik/haftalik/oylik daromad va sof foyda analitikasi.',
    bg: 'var(--dx-secondary-container)',
    fg: 'var(--dx-on-secondary-container)',
  },
  {
    icon: ShieldCheck,
    title: 'Admin nazorati',
    desc: 'Yangi biznes arizalarini ko‘rib chiqish, tasdiqlash yoki aniq sabab bilan rad etish (rol himoyasi Firestore Rules bilan).',
    bg: 'var(--dx-tertiary-container)',
    fg: 'var(--dx-on-tertiary-container)',
  },
] as const;

export const WelcomePage: React.FC<WelcomePageProps> = ({ isDark, onToggleTheme }) => {
  const { firebaseReady, emulatorMode } = useAuth();

  return (
    <div className="min-h-screen flex flex-col dx-pattern-bg">
      <div className="suzani-border-strip w-full" />
      <WelcomeHeader isDark={isDark} onToggleTheme={onToggleTheme} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
        {!firebaseReady && (
          <div
            className="rounded-2xl p-4 border text-xs sm:text-sm"
            style={{
              backgroundColor: 'var(--dx-primary-container)',
              color: 'var(--dx-on-primary-container)',
              borderColor: 'var(--dx-primary)',
            }}
          >
            <strong>Firebase Web konfiguratsiyasi ulanmagan:</strong> Haqiqiy tizimga kirish uchun{' '}
            <code className="font-mono-code">web/.env.example</code> asosida{' '}
            <code className="font-mono-code">web/.env</code> faylini to‘ldiring yoki lokal Firebase
            Emulyatorini ishga tushiring.
          </div>
        )}
        {emulatorMode && (
          <div
            className="rounded-2xl px-4 py-2.5 border text-xs font-bold inline-flex items-center gap-2"
            style={{
              backgroundColor: 'var(--dx-secondary-container)',
              color: 'var(--dx-on-secondary-container)',
              borderColor: 'var(--dx-secondary)',
            }}
          >
            🧪 Mahalliy Firebase Auth + Firestore Emulyator rejimi faol (`demo-dasturxon`)
          </div>
        )}
        <WelcomeHero />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURE_CARDS.map(({ icon: Icon, title, desc, bg, fg }) => (
            <div
              key={title}
              className="rounded-3xl p-6 border space-y-3"
              style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: bg, color: fg }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold">{title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
        <OwnerCalloutBanner />
      </main>
    </div>
  );
};

const WelcomeHeader: React.FC<{ isDark: boolean; onToggleTheme: () => void }> = ({
  isDark,
  onToggleTheme,
}) => (
  <header
    className="border-b backdrop-blur-md"
    style={{
      backgroundColor: 'color-mix(in srgb, var(--dx-bg) 88%, transparent)',
      borderColor: 'var(--dx-border)',
    }}
  >
    <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
      <DxLogo size={32} subtitle="Mahalla Bozori" />
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Mavzuni almashtirish"
          className="p-2 rounded-xl border cursor-pointer"
          style={{
            backgroundColor: 'var(--dx-surface)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-text)',
          }}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link
          to="/login"
          className="px-2.5 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold whitespace-nowrap"
          style={{
            backgroundColor: 'var(--dx-surface)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-text)',
          }}
        >
          Kirish
        </Link>
        <Link
          to="/register"
          className="px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          Ro‘yxatdan o‘tish
        </Link>
      </div>
    </div>
  </header>
);

const WelcomeHero: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
    <div className="lg:col-span-7 space-y-6">
      <span
        className="inline-block px-3.5 py-1.5 rounded-full text-xs font-extrabold border"
        style={{
          backgroundColor: 'var(--dx-primary-container)',
          color: 'var(--dx-on-primary-container)',
          borderColor: 'color-mix(in srgb, var(--dx-primary) 25%, transparent)',
        }}
      >
        📍 Yunusobod · Mahalliy bizneslar veb-platformasi
      </span>
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight">
        Mahallangiz ta’mi, <br />
        <span style={{ color: 'var(--dx-primary)' }}>bitta raqamli dasturxonda.</span>
      </h1>
      <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
        Novvoyxona, qandolatxona va oshxonalardan yangi mahsulotlarni toping, olib ketish yoki
        yetkazib berishga buyurtma bering, biznesingiz daromadi va xarajatlarini real vaqtda tahlil
        qiling.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold shadow-md"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          Boshlash <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border text-sm sm:text-base font-bold"
          style={{
            backgroundColor: 'var(--dx-surface)',
            borderColor: 'var(--dx-border)',
            color: 'var(--dx-text)',
          }}
        >
          Hisobga kirish
        </Link>
      </div>
    </div>
    <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
      <img
        src="./images/food_tandir_non.jpg"
        alt="Tandir non"
        className="rounded-3xl h-44 w-full object-cover shadow-md border"
        style={{ borderColor: 'var(--dx-border)' }}
      />
      <img
        src="./images/food_plov.jpg"
        alt="Palov"
        className="rounded-3xl h-44 w-full object-cover shadow-md border mt-5"
        style={{ borderColor: 'var(--dx-border)' }}
      />
      <img
        src="./images/food_somsa.jpg"
        alt="Tandir somsa"
        className="rounded-3xl h-44 w-full object-cover shadow-md border -mt-2"
        style={{ borderColor: 'var(--dx-border)' }}
      />
      <img
        src="./images/food_medovik.jpg"
        alt="Medovik"
        className="rounded-3xl h-44 w-full object-cover shadow-md border mt-3"
        style={{ borderColor: 'var(--dx-border)' }}
      />
    </div>
  </div>
);

const OwnerCalloutBanner: React.FC = () => (
  <div
    className="rounded-3xl p-6 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
  >
    <div className="flex items-center gap-3">
      <Store className="w-6 h-6 shrink-0" style={{ color: 'var(--dx-primary)' }} />
      <div>
        <div className="font-bold text-sm">Mahalliy novvoyxona yoki oshxona egasimisiz?</div>
        <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
          Ro‘yxatdan o‘tishda “Biznes egasi” rolini tanlang va biznes profilingizni tasdiqqa
          yuboring.
        </div>
      </div>
    </div>
    <Link
      to="/register"
      className="px-4 py-2.5 rounded-xl text-xs font-bold shrink-0"
      style={{ backgroundColor: 'var(--dx-secondary)', color: 'var(--dx-on-secondary)' }}
    >
      Biznes ochish →
    </Link>
  </div>
);
