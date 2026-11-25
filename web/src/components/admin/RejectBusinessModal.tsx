import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MIN_REJECTION_REASON_LENGTH } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import type { Business } from '../../types/domain';

interface RejectBusinessModalProps {
  business: Business;
  onClose: () => void;
  onConfirmReject: (businessId: string, reason: string) => Promise<void>;
}

export const RejectBusinessModal: React.FC<RejectBusinessModalProps> = ({
  business,
  onClose,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (reason.trim().length < MIN_REJECTION_REASON_LENGTH) {
      setError('Kamida 3 ta belgili sabab kiriting.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmReject(business.id, reason);
      onClose();
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Rad etishda xatolik.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Biznesni rad etish</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
          {business.name}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Rad etish sababini kiriting (kamida 3 belgi)"
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        {error && (
          <div
            className="p-2.5 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: 'var(--dx-error-container)',
              color: 'var(--dx-on-error-container)',
            }}
          >
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
            style={{ borderColor: 'var(--dx-border)' }}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={submitting || reason.trim().length < MIN_REJECTION_REASON_LENGTH}
            className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-error)', color: '#fff' }}
          >
            {submitting ? 'Yuborilmoqda…' : 'Rad etish'}
          </button>
        </div>
      </form>
    </div>
  );
};
