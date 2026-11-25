import React from 'react';
import { BarChart3, BellRing, LockKeyhole, PackageCheck, ShieldAlert, ShoppingCart } from 'lucide-react';
import type { Translations } from '../i18n/translations';

interface FeaturesSectionProps {
  t: Translations;
}

const ECOSYSTEM_CARDS = [
  {
    role: 'XARIDOR',
    icon: ShoppingCart,
    accent: 'var(--dx-primary)',
    container: 'var(--dx-primary-container)',
    ink: 'var(--dx-on-primary-container)',
    title: 'Real vaqtdagi mahalla bozori',
    bullets: [
      '7 toifa (Nonvoyxona, Qandolatxona, Pishiriq, Choyxona, Oshxona, Kafe, Boshqa) bo‘yicha qidiruv va filtr',
      '“● Hozir mavjud” issiq mahsulotlar va vaqtli chegirmalar (-10% / -15%)',
      'Olib ketish yoki yetkazib berish (manzil + telefon bilan), transaction orqali zaxira kamaytirish',
      'Kutilmoqda → Qabul qilindi → Tayyor → Yakunlandi status xronologiyasi va tel:/Telegram aloqa',
    ],
  },
  {
    role: 'BIZNES EGASI',
    icon: BarChart3,
    accent: 'var(--dx-secondary)',
    container: 'var(--dx-secondary-container)',
    ink: 'var(--dx-on-secondary-container)',
    title: 'Buyurtma, zaxira va sof foyda tahlili',
    bullets: [
      'Yangi, jarayondagi va tarixiy buyurtmalarni boshqarish, to‘lovni “To‘langan” (paidAt) deb belgilash',
      'Tannarx (costPrice) maxfiy subkolleksiyada saqlanadi — xaridorlarga mutlaqo ko‘rinmaydi',
      'Yalpi foyda = Tushum − COGS; Sof foyda = Yalpi foyda − Biznes xarajatlari (Asia/Tashkent)',
      'Eng ko‘p sotilgan, eng foydali va zarar keltiruvchi mahsulotlar hamda xarajatlar jurnali',
    ],
  },
  {
    role: 'ADMINISTRATOR',
    icon: ShieldAlert,
    accent: 'var(--dx-tertiary)',
    container: 'var(--dx-tertiary-container)',
    ink: 'var(--dx-on-tertiary-container)',
    title: 'Qat’iy moderatsiya va rol nazorati',
    bullets: [
      'Yangi bizneslar majburiy pending holatda yaratiladi — o‘z-o‘zini tasdiqlash bloklangan',
      'Tasdiqlash yoki kamida 3 belgili aniq sabab (rejectionReason) bilan rad etish',
      'Owner rad etilgan biznesni tahrirlab qayta yuborishi (resubmit) mumkin',
      'Rol eskalatsiyasi (admin bo‘lishga urinish) Firestore rules darajasida bloklangan',
    ],
  },
];

const MICRO_HIGHLIGHTS = [
  {
    icon: LockKeyhole,
    title: 'Email/Parol + Google Credential Manager',
    desc: 'Auth rollback mexanizmi: agar Firestore profil yozishda xatolik bo‘lsa, yaratilgan Auth hisob avtomatik qaytariladi.',
  },
  {
    icon: PackageCheck,
    title: 'Line-Items & UnitCost Snapshot',
    desc: 'Har bir buyurtma orders/{id}/items/{itemId} bilan yaratiladi; yakunlanganda unitCost tarixiy snapshot sifatida yoziladi.',
  },
  {
    icon: BellRing,
    title: 'One-Shot Analitika & Real-Time Lenta',
    desc: 'Buyurtma va mahsulotlar callbackFlow orqali jonli yangilanadi, moliyaviy analitika esa ortiqcha o‘qishlarsiz .get() bilan hisoblanadi.',
  },
];

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ t }) => {
  return (
    <section
      id="features"
      className="py-16 sm:py-20 border-t"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--dx-surface-variant) 42%, var(--dx-bg))',
        borderColor: 'var(--dx-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: 'var(--dx-primary)' }}>
            {t.featuresEyebrow}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--dx-text)' }}>
            {t.featuresTitle}
          </h2>
          <p className="text-base" style={{ color: 'var(--dx-muted)' }}>
            {t.featuresSubtitle}
          </p>
        </div>

        {/* 3 Role Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {ECOSYSTEM_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.role}
                className="rounded-3xl p-6 sm:p-7 border flex flex-col gap-5 shadow-sm"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-extrabold tracking-widest px-3 py-1 rounded-full"
                    style={{ backgroundColor: card.container, color: card.ink }}
                  >
                    {card.role}
                  </span>
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: card.container, color: card.ink }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-display text-xl font-bold" style={{ color: 'var(--dx-text)' }}>
                  {card.title}
                </h3>

                <ul className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
                  {card.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: card.accent }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 3 Engineering Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MICRO_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl p-5 border flex items-start gap-4"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--dx-text)' }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--dx-muted)' }}>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
