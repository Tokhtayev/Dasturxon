import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, ReceiptText, Trash2, X } from 'lucide-react';
import { formatSoM } from '../../services/analytics';
import { BYTES_PER_KILOBYTE } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import { compressImageToBase64 } from '../../services/imageCompression';
import type { CustomerOrder } from '../../types/domain';

const BASE64_BYTE_RATIO = 0.75;

interface PaymentReceiptModalProps {
  order: CustomerOrder;
  mode: 'confirm_payment' | 'edit_receipt';
  onClose: () => void;
  onConfirm: (receiptUrl: string | undefined) => Promise<void>;
}

const ReceiptPhotoPicker: React.FC<{
  receiptUrl: string;
  mode: 'confirm_payment' | 'edit_receipt';
  busy: boolean;
  compressing: boolean;
  onPickFile: (file: File | undefined) => void;
  onClear: () => void;
}> = ({ receiptUrl, mode, busy, compressing, onPickFile, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const approxKb = receiptUrl
    ? Math.max(1, Math.round((receiptUrl.length * BASE64_BYTE_RATIO) / BYTES_PER_KILOBYTE))
    : 0;

  return (
    <div className="space-y-2">
      <div
        className="relative h-44 rounded-2xl border overflow-hidden flex items-center justify-center p-2"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        {receiptUrl ? (
          <img
            src={receiptUrl}
            alt="Yuklangan to‘lov cheki"
            className="max-h-full w-auto rounded-xl object-contain"
          />
        ) : (
          <div className="text-center space-y-1.5 px-4" style={{ color: 'var(--dx-muted)' }}>
            <ReceiptText className="w-8 h-8 mx-auto opacity-75" />
            <div className="text-xs font-bold">Chek rasmi tanlanmagan</div>
            <div className="text-[11px]">
              {mode === 'confirm_payment'
                ? 'Cheksiz tasdiqlash yoki Payme / Click / kassa chekini yuklash mumkin.'
                : 'Galereyadan tanlang yoki kamera orqali suratga oling.'}
            </div>
          </div>
        )}
        {receiptUrl && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/65 text-white">
            ~{approxKb} KB JPEG
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            onPickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          className="hidden"
          data-testid="receipt-photo-input"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            onPickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        >
          <ImagePlus className="w-3.5 h-3.5" />{' '}
          {compressing ? 'Siqilmoqda…' : receiptUrl ? 'Boshqa chek' : 'Chek tanlash'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraInputRef.current?.click()}
          className="px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        >
          <Camera className="w-3.5 h-3.5" /> Kamera
        </button>
        {receiptUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={onClear}
            aria-label="Chekni olib tashlash"
            className="px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer"
            style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-error)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
        Maksimal 5 MB; yuklashdan oldin avtomatik ≤ 800px JPEG qilib siqiladi.
      </p>
    </div>
  );
};

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

        <div
          className="rounded-2xl border p-3 text-xs flex items-center justify-between"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        >
          <span className="font-semibold">
            {order.productName} ({order.quantity} ta)
          </span>
          <span className="font-extrabold" style={{ color: 'var(--dx-primary)' }}>
            {formatSoM(order.totalPrice)}
          </span>
        </div>

        <ReceiptPhotoPicker
          receiptUrl={receiptUrl}
          mode={mode}
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
