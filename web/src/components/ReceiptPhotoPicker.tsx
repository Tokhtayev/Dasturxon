import React, { useRef } from 'react';
import { Camera, ImagePlus, ReceiptText, Trash2 } from 'lucide-react';
import { BYTES_PER_KILOBYTE } from '../services/constants';

const BASE64_BYTE_RATIO = 0.75;

interface ReceiptPhotoPickerProps {
  receiptUrl: string;
  emptyHint: string;
  busy: boolean;
  compressing: boolean;
  onPickFile: (file: File | undefined) => void;
  onClear: () => void;
}

export const ReceiptPhotoPicker: React.FC<ReceiptPhotoPickerProps> = ({
  receiptUrl,
  emptyHint,
  busy,
  compressing,
  onPickFile,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const approxKb = receiptUrl
    ? Math.max(1, Math.round((receiptUrl.length * BASE64_BYTE_RATIO) / BYTES_PER_KILOBYTE))
    : 0;

  return (
    <div className="space-y-2">
      <div
        className="relative h-40 rounded-2xl border overflow-hidden flex items-center justify-center p-2"
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
            <ReceiptText className="w-7 h-7 mx-auto opacity-75" />
            <div className="text-xs font-bold">Chek rasmi tanlanmagan</div>
            <div className="text-[11px]">{emptyHint}</div>
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
