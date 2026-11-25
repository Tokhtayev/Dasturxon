import React, { useState } from 'react';
import { CheckCircle2, Database, FileCode2, Info, Lock, ShieldCheck } from 'lucide-react';
import type { Translations } from '../i18n/translations';

interface ArchitectureSecuritySectionProps {
  t: Translations;
}

interface CollectionDoc {
  path: string;
  fields: string[];
  ownerRule: string;
  readRule: string;
  writeRule: string;
}

const FIRESTORE_COLLECTIONS: CollectionDoc[] = [
  {
    path: '/users/{userId}',
    fields: ['fullName: String', 'normalizedNickname: String', 'email: String', 'phone: String', 'role: "customer" | "owner" | "admin"', 'createdAt: Timestamp'],
    ownerRule: 'request.auth.uid == userId',
    readRule: 'Faqat foydalanuvchining o‘zi yoki Admin',
    writeRule: 'Yaratishda role faqat customer/owner; yangilashda role va email o‘zgarmas (immutable)',
  },
  {
    path: '/usernames/{normalizedNickname}',
    fields: ['uid: String', 'createdAt: Timestamp'],
    ownerRule: 'request.resource.data.uid == request.auth.uid',
    readRule: 'Tizimga kirgan foydalanuvchilar (bandlikni tekshirish)',
    writeRule: 'Update taqiqlangan (false); Delete faqat egasi yoki hisob o‘chirilganda',
  },
  {
    path: '/businesses/{businessId}',
    fields: ['ownerId: String', 'name: String', 'type: String', 'address: String', 'phone: String', 'status: "pending" | "approved" | "rejected"', 'rejectionReason?: String'],
    ownerRule: 'ownerId == request.auth.uid',
    readRule: 'Approved barcha kirganlarga; pending/rejected faqat egasi va Admin',
    writeRule: 'Create majburiy status == "pending"; Owner status va ownerId ni o‘zgartira olmaydi',
  },
  {
    path: '/products/{productId}',
    fields: ['businessId: String', 'name: String', 'price: Long (UZS)', 'published: Boolean', 'status: "available" | "hot_ready" | "sold_out"', 'stock?: Long', 'discountPercent: Long'],
    ownerRule: 'isBusinessOwner(businessId)',
    readRule: 'Approved biznes mahsulotlari barchaga; pending faqat egasi/Admin',
    writeRule: "Ommaviy hujjatda costPrice QAT'IY TAQIQLANGAN (!('costPrice' in data))",
  },
  {
    path: '/products/{productId}/private/cost',
    fields: ['costPrice: Long (UZS)', 'updatedAt: Timestamp'],
    ownerRule: 'isBusinessOwner(parent.businessId)',
    readRule: 'FAQAT biznes egasi yoki Admin (xaridorlar kira olmaydi)',
    writeRule: 'FAQAT biznes egasi yoki Admin',
  },
  {
    path: '/orders/{orderId} + /items/{itemId}',
    fields: ['customerId: String', 'businessId: String', 'status: 6 holat', 'paymentStatus: "unpaid" | "paid"', 'fulfillmentType: "pickup" | "delivery"', 'unitPrice / unitCost snapshot'],
    ownerRule: 'customerId == uid || isBusinessOwner(businessId)',
    readRule: 'Faqat buyurtma bergan xaridor, biznes egasi va Admin',
    writeRule: 'Xaridor faqat pending → cancelled; Owner status/to‘lov/unitCost; line item unitPrice == product.price',
  },
  {
    path: '/expenses/{expenseId} & /events/{eventId}',
    fields: ['expenses: businessId, title, amount, category', 'events: businessId, productId?, userId, type'],
    ownerRule: 'expenses: isBusinessOwner; events: userId == uid',
    readRule: 'Xarajatlar faqat biznes egasi/Admin; view eventlar tizimga kirganlarga',
    writeRule: 'Soxta analitika eventlarini oldini olish uchun userId == request.auth.uid tekshiriladi',
  },
];

const VERIFIED_CHECKS = [
  { suite: 'Firestore Security Rules Emulator Tests', command: 'npm run test:rules', count: '32 / 32', status: 'PASS' },
  { suite: 'JVM Unit Tests (Analytics, Models, Auth, ViewModels)', command: './gradlew testDebugUnitTest', count: '59 / 59', status: 'PASS' },
  { suite: 'Android Lint Security & Accessibility Checks', command: './gradlew lintDebug', count: '0 fatal', status: 'PASS' },
  { suite: 'Debug APK Build Packaging (Hilt + Compose)', command: './gradlew assembleDebug', count: 'APK ok', status: 'PASS' },
];

export const ArchitectureSecuritySection: React.FC<ArchitectureSecuritySectionProps> = ({ t }) => {
  const [selectedIdx, setSelectedIdx] = useState(3);
  const selected = FIRESTORE_COLLECTIONS[selectedIdx];

  return (
    <section id="architecture" className="py-16 sm:py-20 border-t" style={{ borderColor: 'var(--dx-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: 'var(--dx-secondary)' }}>
            {t.archEyebrow}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--dx-text)' }}>
            {t.archTitle}
          </h2>
          <p className="text-base" style={{ color: 'var(--dx-muted)' }}>
            {t.archSubtitle}
          </p>
        </div>

        {/* Interactive Schema & Rules Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-2">
            {FIRESTORE_COLLECTIONS.map((col, idx) => {
              const active = idx === selectedIdx;
              return (
                <button
                  key={col.path}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className="w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--dx-primary-container)' : 'var(--dx-surface)',
                    borderColor: active ? 'var(--dx-primary)' : 'var(--dx-border)',
                    color: active ? 'var(--dx-on-primary-container)' : 'var(--dx-text)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Database className="w-4 h-4 shrink-0" />
                    <span className="font-mono-code text-xs sm:text-sm font-bold truncate">{col.path}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                </button>
              );
            })}
          </div>

          <div
            className="lg:col-span-7 rounded-3xl p-6 sm:p-7 border space-y-5"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--dx-border)' }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dx-muted)' }}>
                  Cloud Firestore Collection
                </div>
                <div className="font-mono-code text-lg sm:text-xl font-bold mt-0.5" style={{ color: 'var(--dx-primary)' }}>
                  {selected.path}
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'var(--dx-secondary-container)', color: 'var(--dx-on-secondary-container)' }}
              >
                <ShieldCheck className="w-4 h-4" /> Least-Privilege Rule
              </span>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--dx-muted)' }}>
                Haqiqiy maydonlar (Schema)
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.fields.map((f) => (
                  <span
                    key={f}
                    className="font-mono-code text-xs px-2.5 py-1 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--dx-bg)',
                      borderColor: 'var(--dx-border)',
                      color: 'var(--dx-text)',
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}>
                <div className="font-bold mb-1" style={{ color: 'var(--dx-secondary)' }}>O‘qish ruxsati (Read)</div>
                <div className="leading-relaxed" style={{ color: 'var(--dx-text)' }}>{selected.readRule}</div>
              </div>
              <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}>
                <div className="font-bold mb-1" style={{ color: 'var(--dx-primary)' }}>Yozish cheklovi (Write)</div>
                <div className="leading-relaxed" style={{ color: 'var(--dx-text)' }}>{selected.writeRule}</div>
              </div>
            </div>

            <div className="text-xs font-mono-code px-3.5 py-2.5 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'var(--dx-surface-variant)', color: 'var(--dx-text)' }}>
              <FileCode2 className="w-4 h-4 shrink-0" style={{ color: 'var(--dx-primary)' }} />
              <span>Owner Check: {selected.ownerRule}</span>
            </div>
          </div>
        </div>

        {/* Verified Test Results Table from docs/STATUS.md */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className="lg:col-span-8 rounded-3xl p-6 border space-y-4"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold" style={{ color: 'var(--dx-text)' }}>
                Avtomatlashtirilgan tekshiruv natijalari (<code className="font-mono-code text-base">docs/STATUS.md</code>)
              </h3>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'var(--dx-tertiary-container)', color: 'var(--dx-on-tertiary-container)' }}
              >
                Verified
              </span>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--dx-border)' }}>
              {VERIFIED_CHECKS.map((row) => (
                <div key={row.suite} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--dx-text)' }}>{row.suite}</div>
                    <div className="font-mono-code text-xs mt-0.5" style={{ color: 'var(--dx-muted)' }}>{row.command}</div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono-code text-xs font-bold" style={{ color: 'var(--dx-text)' }}>{row.count}</span>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: 'var(--dx-tertiary-container)', color: 'var(--dx-on-tertiary-container)' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="lg:col-span-4 rounded-3xl p-6 border space-y-3"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: 'var(--dx-primary)' }}>
              <Info className="w-4 h-4" /> MVP Texnik Cheklovlari
            </div>
            <ul className="space-y-2.5 text-xs leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
              <li>• <strong>Firebase Spark tarifi:</strong> Cloud Functions o‘rniga xavfsiz client-side Firestore transaction va rules tekshiruvi ishlatiladi.</li>
              <li>• <strong>To‘lov oqimi:</strong> To‘lovlar joyida naqd yoki QR orqali amalga oshiriladi; biznes egasi buyurtmani “To‘langan” deb belgilaydi.</li>
              <li>• <strong>Media:</strong> Spark rejasida Storage cheklanganligi sababli chiroyli gradient va mahalliy rasm aktivlaridan foydalaniladi.</li>
              <li>• <strong>Android to‘plam:</strong> Kotlin + Jetpack Compose + Material 3 + Hilt (<code className="font-mono-code">com.example.dasturxon</code>).</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
