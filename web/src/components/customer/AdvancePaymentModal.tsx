import React, { useState } from 'react';
import { PhoneCall, X } from 'lucide-react';
import { formatSoM } from '../../services/analytics';
import { getReadableErrorMessage } from '../../services/errors';
import { compressImageToBase64 } from '../../services/imageCompression';
import { calculateOrderPrepayment } from '../../services/orderLogic';
import { buildTelHref, formatContactPhoneDisplay } from '../../services/validators';
import type { CustomerOrder } from '../../types/domain';
import { ReceiptPhotoPicker } from '../ReceiptPhotoPicker';

interface AdvancePaymentModalProps {
  order: CustomerOrder;
  businessPhone?: string;
  onClose: () => void;
  onSubmitReceipt: (receiptUrl: string) => Promise<void>;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  order,
  businessPhone,
  onClose,
  onSubmitReceipt,
}) => {
  const [receiptUrl, setReceiptUrl] = useState(order.advanceReceiptUrl ?? '');
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallback = calculateOrderPrepayment(order.totalPrice);
  const advanceAmount = order.prepaymentAmount ?? fallback.prepaymentAmount;
  const remainingAmount = order.totalPrice - advanceAmount;
  const cleanPhone = formatContactPhoneDisplay(businessPhone);

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
    if (!receiptUrl) {
      setError('Avval 50% avans to‘lov chekini tanlang.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmitReceipt(receiptUrl);
      onClose();
    } catch (err) {
      setError(getReadableErrorMessage(err, 'Chekni yuborishda xatolik yuz berdi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">50% Oldindan to‘lov (Avans)</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--dx-muted)' }}>
              #{order.id.slice(0, 6).toUpperCase()} · {order.businessName}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AdvanceSummaryBox
          advanceAmount={advanceAmount}
          remainingAmount={remainingAmount}
          cleanPhone={cleanPhone}
        />

        <ReceiptPhotoPicker
          receiptUrl={receiptUrl}
          emptyHint="Payme, Click yoki karta o‘tkazmasi chekini yuklang — nonvoy tekshirib tasdiqlaydi."
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
            disabled={compressing || saving || !receiptUrl}
            className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            {saving ? 'Yuborilmoqda…' : '50% Avans chekini yuborish'}
          </button>
        </div>
      </form>
    </div>
  );
};

const AdvanceSummaryBox: React.FC<{
  advanceAmount: number;
  remainingAmount: number;
  cleanPhone: string;
}> = ({ advanceAmount, remainingAmount, cleanPhone }) => (
  <div
    className="rounded-2xl border p-3.5 text-xs space-y-1.5"
    style={{
      backgroundColor: 'var(--dx-secondary-container)',
      borderColor: 'var(--dx-secondary)',
    }}
  >
    <div className="flex justify-between font-bold">
      <span>50% Avans summasi:</span>
      <span style={{ color: 'var(--dx-primary)' }}>{formatSoM(advanceAmount)}</span>
    </div>
    <div className="flex justify-between" style={{ color: 'var(--dx-muted)' }}>
      <span>Olib ketishda qolgan 50%:</span>
      <span>{formatSoM(remainingAmount)}</span>
    </div>
    {cleanPhone && (
      <div className="pt-1 flex items-center justify-between gap-2">
        <span style={{ color: 'var(--dx-muted)' }}>Karta/to‘lov uchun bog‘lanish:</span>
        <a
          href={buildTelHref(cleanPhone)}
          className="font-bold underline inline-flex items-center gap-1"
          style={{ color: 'var(--dx-secondary)' }}
        >
          <PhoneCall className="w-3 h-3" /> {cleanPhone}
        </a>
      </div>
    )}
  </div>
);
