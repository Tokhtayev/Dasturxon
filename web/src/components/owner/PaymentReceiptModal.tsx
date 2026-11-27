import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatSoM } from '../../services/analytics';
import { getReadableErrorMessage } from '../../services/errors';
import { compressImageToBase64 } from '../../services/imageCompression';
import type { CustomerOrder } from '../../types/domain';
import { ReceiptPhotoPicker } from '../ReceiptPhotoPicker';

interface PaymentReceiptModalProps {
  order: CustomerOrder;
  mode: 'confirm_payment' | 'edit_receipt';
  onClose: () => void;
  onConfirm: (receiptUrl: string | undefined) => Promise<void>;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  order,
  mode,
  onClose,
  onConfirm,
}) => {
  const [receiptUrl, setReceiptUrl] = useState<string>(order.receiptUrl ?? '');
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilePicked = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      setReceiptUrl(await compressImageToBase64(file));
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Chek rasmini qayta ishlab bo‘lmadi.'));
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onConfirm(mode === 'confirm_payment' ? receiptUrl || undefined : receiptUrl);
      onClose();
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Saqlab bo‘lmadi.'));
    } finally {
      setSaving(false);
    }
  };

  const disableSave =
    compressing || saving || (mode === 'edit_receipt' && !receiptUrl && !order.receiptUrl);
  const submitLabel = saving
    ? 'Saqlanmoqda…'
    : mode === 'confirm_payment'
      ? receiptUrl
        ? 'Chek bilan tasdiqlash'
        : 'Cheksiz tasdiqlash'
      : receiptUrl
        ? 'Chekni saqlash'
        : 'Chekni o‘chirish';

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">
              {mode === 'confirm_payment' ? 'To‘lovni tasdiqlash' : 'To‘lov chekini yuklash'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--dx-muted)' }}>
              #{order.id.slice(0, 6).toUpperCase()} · {order.customerName || 'Xaridor'} ·{' '}
              {formatSoM(order.totalPrice)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <PaymentReceiptOrderSummary order={order} />

        <ReceiptPhotoPicker
          receiptUrl={receiptUrl}
          emptyHint={
            mode === 'confirm_payment'
              ? 'Cheksiz tasdiqlash yoki Payme / Click / kassa chekini yuklash mumkin.'
              : 'Galereyadan tanlang yoki kamera orqali suratga oling.'
          }
          busy={compressing || saving}
          compressing={compressing}
          onPickFile={(f) => void handleFilePicked(f)}
          onClear={() => setReceiptUrl('')}
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

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
            style={{ borderColor: 'var(--dx-border)' }}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={disableSave}
            className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

const PaymentReceiptOrderSummary: React.FC<{ order: CustomerOrder }> = ({ order }) => (
  <div
    className="rounded-2xl border p-3 text-xs space-y-1"
    style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
  >
    <div className="flex items-center justify-between">
      <span className="font-semibold">
        {order.productName} ({order.quantity} ta)
      </span>
      <span className="font-extrabold" style={{ color: 'var(--dx-primary)' }}>
        {formatSoM(order.totalPrice)}
      </span>
    </div>
    {order.prepaymentStatus === 'advance_paid' && order.prepaymentAmount && (
      <div className="text-[11px]" style={{ color: 'var(--dx-tertiary)' }}>
        ✅ 50% avans olingan: {formatSoM(order.prepaymentAmount)} · Qolgan:{' '}
        {formatSoM(Math.max(0, order.totalPrice - order.prepaymentAmount))}
      </div>
    )}
  </div>
);
