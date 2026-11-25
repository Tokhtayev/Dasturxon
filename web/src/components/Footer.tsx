import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { Translations } from '../i18n/translations';
import { DxLogo } from './DxLogo';

interface FooterProps {
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="border-t pt-12 pb-8" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <DxLogo size={38} subtitle={t.brandSubtitle} />
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--dx-muted)' }}>
              {t.footerTagline}
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="font-bold" style={{ color: 'var(--dx-text)' }}>Bo‘limlar</div>
            <div className="flex flex-col gap-1.5" style={{ color: 'var(--dx-muted)' }}>
              <a href="#hero" className="hover:underline">{t.navHome}</a>
              <a href="#live-app" className="hover:underline">{t.navLiveApp}</a>
              <a href="#compare" className="hover:underline">{t.navCompare}</a>
              <a href="#features" className="hover:underline">{t.navFeatures}</a>
              <a href="#architecture" className="hover:underline">{t.navArchitecture}</a>
            </div>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="font-bold" style={{ color: 'var(--dx-text)' }}>Aloqa va Manzil</div>
            <div className="space-y-2" style={{ color: 'var(--dx-muted)' }}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: 'var(--dx-primary)' }} />
                <span>Yunusobod tumani, Toshkent, O‘zbekiston</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" style={{ color: 'var(--dx-secondary)' }} />
                <a href="tel:+998901234567" className="hover:underline">+998 90 123 45 67</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--dx-tertiary)' }} />
                <a href="mailto:hello@dasturxon.uz" className="hover:underline">hello@dasturxon.uz</a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-muted)' }}>
          <span>{t.footerRights}</span>
          <span>Dasturxon v2.0 · Kotlin Jetpack Compose & React Web Platform</span>
        </div>
      </div>
    </footer>
  );
};
