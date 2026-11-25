import React from 'react';
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Store, ShoppingBag } from 'lucide-react';
import type { Translations } from '../i18n/translations';
import type { AppRole } from '../types/dasturxon';

interface HeroSectionProps {
  t: Translations;
  onJumpToWorkspace: (role: AppRole) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ t, onJumpToWorkspace }) => {
  return (
    <section id="hero" className="relative overflow-hidden dx-pattern-bg py-12 sm:py-16 lg:py-20">
      {/* Subtle warm radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 w-[460px] h-[460px] rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #F2B24C 0%, #B7500A 60%, transparent 100%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left editorial column */}
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border"
              style={{
                backgroundColor: 'var(--dx-primary-container)',
                color: 'var(--dx-on-primary-container)',
                borderColor: 'color-mix(in srgb, var(--dx-primary) 25%, transparent)',
              }}
            >
              <span>{t.heroBadge}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08]">
              <span style={{ color: 'var(--dx-text)' }}>{t.heroTitleLine1}</span>
              <br />
              <span style={{ color: 'var(--dx-primary)' }}>{t.heroTitleLine2}</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--dx-muted)' }}>
              {t.heroSubtitle}
            </p>

            {/* Primary Dual CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => onJumpToWorkspace('customer')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold shadow-md transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
                style={{
                  backgroundColor: 'var(--dx-primary)',
                  color: 'var(--dx-on-primary)',
                }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{t.heroPrimaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onJumpToWorkspace('owner')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold border-2 transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                style={{
                  backgroundColor: 'var(--dx-secondary-container)',
                  color: 'var(--dx-on-secondary-container)',
                  borderColor: 'color-mix(in srgb, var(--dx-secondary) 35%, transparent)',
                }}
              >
                <Store className="w-5 h-5" />
                <span>{t.heroSecondaryCta}</span>
              </button>
            </div>

            {/* Grounded Project Metrics */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t"
              style={{ borderColor: 'var(--dx-border)' }}
            >
              <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="text-2xl font-extrabold font-display" style={{ color: 'var(--dx-primary)' }}>6 ta</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--dx-muted)' }}>{t.statBusinesses}</div>
              </div>
              <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="text-2xl font-extrabold font-display" style={{ color: 'var(--dx-secondary)' }}>12 ta</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--dx-muted)' }}>{t.statProducts}</div>
              </div>
              <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="text-2xl font-extrabold font-display" style={{ color: 'var(--dx-tertiary)' }}>3 ta</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--dx-muted)' }}>{t.statRoles}</div>
              </div>
              <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="text-2xl font-extrabold font-display" style={{ color: 'var(--dx-text)' }}>32 / 59</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--dx-muted)' }}>{t.statTests}</div>
              </div>
            </div>
          </div>

          {/* Right showcase column: Interactive Android App Showcase + Real Dasturxon Art */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[390px]">
              {/* Floating Emblem Pill Top-Left */}
              <div
                className="hidden sm:flex items-center gap-2.5 absolute -left-10 -top-4 z-20 px-3.5 py-2.5 rounded-2xl shadow-xl border"
                style={{
                  backgroundColor: 'var(--dx-surface)',
                  borderColor: 'var(--dx-border)',
                }}
              >
                <img
                  src="./images/dasturxon-emblem.png"
                  alt="Dasturxon nishoni"
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <div className="text-xs font-extrabold" style={{ color: 'var(--dx-text)' }}>Baraka novvoyxonasi</div>
                  <div className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--dx-tertiary)' }}>
                    <span className="w-2 h-2 rounded-full inline-block animate-live-dot" style={{ backgroundColor: 'var(--dx-tertiary)' }} />
                    Tandir non · 5 000 so‘m
                  </div>
                </div>
              </div>

              {/* Floating Security Pill Bottom-Right */}
              <div
                className="hidden sm:flex items-center gap-2 absolute -right-5 bottom-12 z-20 px-3.5 py-2.5 rounded-2xl shadow-xl border"
                style={{
                  backgroundColor: 'var(--dx-surface)',
                  borderColor: 'var(--dx-border)',
                }}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--dx-secondary)' }} />
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--dx-text)' }}>Firestore Transaction</div>
                  <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>Zaxira himoyasi ✓</div>
                </div>
              </div>

              {/* Phone Shell */}
              <div
                className="rounded-[2.5rem] p-3 shadow-2xl border-4"
                style={{
                  backgroundColor: 'var(--dx-surface)',
                  borderColor: 'var(--dx-border)',
                }}
              >
                <div
                  className="rounded-[2rem] overflow-hidden border"
                  style={{
                    backgroundColor: 'var(--dx-bg)',
                    borderColor: 'var(--dx-border)',
                  }}
                >
                  {/* Simulated Android Status Bar */}
                  <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--dx-muted)' }}>
                    <span>08:15</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}>
                      Yunusobod 4-mavze
                    </span>
                    <span>5G · 100%</span>
                  </div>

                  {/* App Header */}
                  <div className="px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--dx-border)', backgroundColor: 'var(--dx-surface)' }}>
                    <div className="flex items-center gap-2">
                      <img src="./images/dasturxon-emblem.png" alt="Dasturxon" className="w-7 h-7 rounded-lg object-cover" />
                      <span className="font-display font-bold text-base" style={{ color: 'var(--dx-primary)' }}>Dasturxon</span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--dx-secondary-container)', color: 'var(--dx-on-secondary-container)' }}
                    >
                      Mahalla Bozori
                    </span>
                  </div>

                  {/* Featured Promo Banner inside Phone */}
                  <div className="p-3.5 space-y-3">
                    <div
                      className="rounded-2xl p-3.5 text-white flex items-center justify-between gap-3 shadow-sm"
                      style={{ background: 'linear-gradient(125deg, #8B4513 0%, #B7500A 55%, #E2944B 100%)' }}
                    >
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/25">
                          AKSIYA -10%
                        </span>
                        <div className="text-sm font-extrabold leading-tight">Issiq Tandir Nonlar</div>
                        <div className="text-[11px] text-white/85">Baraka novvoyxonasi</div>
                      </div>
                      <img
                        src="./images/food_patir_non.jpg"
                        alt="G'ijduvon patir non"
                        className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/40 shrink-0"
                      />
                    </div>

                    {/* Featured Real Product Cards inside Phone */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div
                        className="rounded-2xl overflow-hidden border"
                        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                      >
                        <div className="relative h-24">
                          <img src="./images/food_tandir_non.jpg" alt="Tandir non" className="w-full h-full object-cover" />
                          <span
                            className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--dx-tertiary-container)', color: 'var(--dx-on-tertiary-container)' }}
                          >
                            ● Issiq
                          </span>
                        </div>
                        <div className="p-2.5">
                          <div className="text-xs font-bold truncate">Tandir non</div>
                          <div className="text-[10px] truncate" style={{ color: 'var(--dx-muted)' }}>Baraka novvoy...</div>
                          <div className="text-xs font-extrabold mt-1" style={{ color: 'var(--dx-primary)' }}>5 000 so‘m</div>
                        </div>
                      </div>

                      <div
                        className="rounded-2xl overflow-hidden border"
                        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                      >
                        <div className="relative h-24">
                          <img src="./images/food_plov.jpg" alt="Yunusobod To'y Oshi" className="w-full h-full object-cover" />
                          <span
                            className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--dx-tertiary-container)', color: 'var(--dx-on-tertiary-container)' }}
                          >
                            ● Issiq
                          </span>
                        </div>
                        <div className="p-2.5">
                          <div className="text-xs font-bold truncate">To‘y Oshi</div>
                          <div className="text-[10px] truncate" style={{ color: 'var(--dx-muted)' }}>Osh Markazi</div>
                          <div className="text-xs font-extrabold mt-1" style={{ color: 'var(--dx-primary)' }}>42 000 so‘m</div>
                        </div>
                      </div>
                    </div>

                    {/* Active Order Pill inside Phone */}
                    <div
                      className="rounded-2xl p-3 border flex items-center justify-between"
                      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: 'var(--dx-secondary-container)', color: 'var(--dx-on-secondary-container)' }}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Buyurtma №2715</div>
                          <div className="text-[10px]" style={{ color: 'var(--dx-muted)' }}>Qabul qilindi · 26 000 so‘m</div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--dx-tertiary)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
