import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, MailCheck } from 'lucide-react';
import { loginNotificationRepository } from '../../repositories/loginNotificationRepository';
import { getReadableErrorMessage } from '../../services/errors';

export const AdminGmailWebhookCard: React.FC = () => {
  const [url, setUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    void loginNotificationRepository.getEmailWebhookUrl().then((loaded) => {
      if (!active) return;
      setUrl(loaded);
      setSavedUrl(loaded);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const stored = await loginNotificationRepository.saveEmailWebhookUrl(url);
      setSavedUrl(stored);
      setUrl(stored);
      setFeedback({
        kind: 'ok',
        text: stored
          ? 'Gmail kirish xabarnoma havolasi saqlandi! Endi haqiqiy Gmail hisoblariga xat boradi.'
          : 'Gmail xabarnoma havolasi o‘chirildi.',
      });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: getReadableErrorMessage(err, 'Havolani saqlashda xatolik yuz berdi.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const active = Boolean(savedUrl);

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border space-y-3"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MailCheck className="w-4 h-4" style={{ color: 'var(--dx-primary)' }} />
          <span className="font-bold text-sm">
            Gmail kirish bildirishnomalari (Bepul Apps Script)
          </span>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg"
          style={{
            backgroundColor: active ? 'var(--dx-tertiary-container)' : 'var(--dx-surface-variant)',
            color: active ? 'var(--dx-on-tertiary-container)' : 'var(--dx-muted)',
          }}
        >
          {loading ? 'Tekshirilmoqda…' : active ? 'Ulangan' : 'Ulanmagan'}
        </span>
      </div>

      <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/.../exec"
          className="flex-1 px-3.5 py-2 rounded-xl border text-xs"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        <button
          type="submit"
          disabled={saving || loading}
          className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </form>

      {feedback && (
        <div
          className="p-2.5 rounded-xl text-xs font-bold"
          style={{
            backgroundColor:
              feedback.kind === 'ok' ? 'var(--dx-tertiary-container)' : 'var(--dx-error-container)',
            color:
              feedback.kind === 'ok'
                ? 'var(--dx-on-tertiary-container)'
                : 'var(--dx-on-error-container)',
          }}
        >
          {feedback.text}
        </div>
      )}

      <GmailSetupGuide showGuide={showGuide} onToggle={() => setShowGuide((v) => !v)} />
    </div>
  );
};

const GmailSetupGuide: React.FC<{ showGuide: boolean; onToggle: () => void }> = ({
  showGuide,
  onToggle,
}) => (
  <>
    <button
      type="button"
      onClick={onToggle}
      className="text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
      style={{ color: 'var(--dx-secondary)' }}
    >
      {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      {showGuide ? 'Yo‘riqnomani yopish' : 'Google Apps Script ulash yo‘riqnomasi (2 daqiqa)'}
    </button>

    {showGuide && (
      <ol
        className="text-xs space-y-1 pl-4 list-decimal leading-relaxed"
        style={{ color: 'var(--dx-muted)' }}
      >
        <li>
          <strong>script.google.com</strong> ga kirib yangi loyiha oching va loyihadagi{' '}
          <code>docs/scripts/gmail-login-notifier.gs</code> kodini <code>Code.gs</code> ga joylang.
        </li>
        <li>
          <strong>Deploy → New deployment → Web app</strong> tanlang.
        </li>
        <li>
          <strong>Execute as:</strong> Me · <strong>Who has access:</strong> Anyone qilib Deploy
          bosing.
        </li>
        <li>
          Chiqgan <code>https://script.google.com/macros/s/.../exec</code> manzilini yuqoriga joylab{' '}
          <strong>Saqlash</strong> ni bosing.
        </li>
      </ol>
    )}
  </>
);
