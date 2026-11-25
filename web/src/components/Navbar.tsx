import React, { useState } from 'react';
import { Menu, Moon, Sun, X, ArrowRight } from 'lucide-react';
import type { LanguageCode } from '../types/dasturxon';
import type { Translations } from '../i18n/translations';
import { DxLogo } from './DxLogo';

interface NavbarProps {
  t: Translations;
  lang: LanguageCode;
  onLangChange: (lang: LanguageCode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  t,
  lang,
  onLangChange,
  isDark,
  onToggleTheme,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#hero', label: t.navHome },
    { href: '#live-app', label: t.navLiveApp },
    { href: '#compare', label: t.navCompare },
    { href: '#features', label: t.navFeatures },
    { href: '#architecture', label: t.navArchitecture },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--dx-bg) 88%, transparent)',
        borderColor: 'var(--dx-border)',
      }}
    >
      <div className="suzani-border-strip w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <a href="#hero" className="shrink-0 focus:outline-none">
          <DxLogo size={36} subtitle={t.brandSubtitle} />
        </a>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:opacity-80"
              style={{ color: 'var(--dx-text)' }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          {/* Language Switcher */}
          <div
            className="inline-flex rounded-xl p-0.5 border text-xs font-bold"
            style={{
              backgroundColor: 'var(--dx-surface-variant)',
              borderColor: 'var(--dx-border)',
            }}
          >
            {(['uz', 'ru', 'en'] as LanguageCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onLangChange(code)}
                className="px-2.5 py-1.5 rounded-lg uppercase transition-all cursor-pointer"
                style={{
                  backgroundColor: lang === code ? 'var(--dx-surface)' : 'transparent',
                  color: lang === code ? 'var(--dx-primary)' : 'var(--dx-muted)',
                  boxShadow: lang === code ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {code === 'uz' ? "O'Z" : code.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Mavzuni almashtirish"
            className="p-2 rounded-xl border transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--dx-surface)',
              borderColor: 'var(--dx-border)',
              color: 'var(--dx-text)',
            }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="#live-app"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
            style={{
              backgroundColor: 'var(--dx-primary)',
              color: 'var(--dx-on-primary)',
            }}
          >
            <span>{t.navTryLive}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Mavzu"
            className="p-2 rounded-xl border"
            style={{
              backgroundColor: 'var(--dx-surface)',
              borderColor: 'var(--dx-border)',
              color: 'var(--dx-text)',
            }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menyu"
            className="p-2 rounded-xl border"
            style={{
              backgroundColor: 'var(--dx-surface)',
              borderColor: 'var(--dx-border)',
              color: 'var(--dx-text)',
            }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-3"
          style={{
            backgroundColor: 'var(--dx-surface)',
            borderColor: 'var(--dx-border)',
          }}
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ color: 'var(--dx-text)' }}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--dx-border)' }}>
            <div className="inline-flex rounded-xl p-0.5 border text-xs font-bold" style={{ borderColor: 'var(--dx-border)' }}>
              {(['uz', 'ru', 'en'] as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLangChange(code)}
                  className="px-2.5 py-1 rounded-lg uppercase"
                  style={{
                    backgroundColor: lang === code ? 'var(--dx-primary-container)' : 'transparent',
                    color: lang === code ? 'var(--dx-on-primary-container)' : 'var(--dx-muted)',
                  }}
                >
                  {code === 'uz' ? "O'Z" : code.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href="#live-app"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{
                backgroundColor: 'var(--dx-primary)',
                color: 'var(--dx-on-primary)',
              }}
            >
              {t.navTryLive} →
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
