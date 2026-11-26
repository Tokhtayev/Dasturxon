import React from 'react';
import { Download, RefreshCw, ReceiptText, X } from 'lucide-react';
import { formatSoM } from '../services/analytics';
import type { CustomerOrder } from '../types/domain';

interface ReceiptPreviewModalProps {
  order: CustomerOrder;
  onClose: () => void;
  onReplaceReceipt?: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  order,
  onClose,
  onReplaceReceipt,
}) => {
  if (!order.receiptUrl) return null;

  const uploadedLabel = order.receiptUploadedAtMs
    ? new Date(order.receiptUploadedAtMs).toLocaleString('uz-UZ')
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl border p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5" style={{ color: 'var(--dx-primary)' }} />
            <div>
              <h2 className="font-display text-lg font-bold leading-tight">
                To‘lov cheki #{order.id.slice(0, 6).toUpperCase()}
              </h2>
              <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
                {order.businessName} · {formatSoM(order.totalPrice)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="rounded-2xl border p-2 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        >
          <img
            src={order.receiptUrl}
            alt={`Buyurtma #${order.id.slice(0, 6).toUpperCase()} cheki`}
            className="max-h-[60vh] w-auto rounded-xl object-contain"
          />
        </div>

        <div className="text-xs space-y-0.5" style={{ color: 'var(--dx-muted)' }}>
          <div>
            Mahsulot: <span className="font-semibold">{order.productName}</span> ({order.quantity}{' '}
            ta)
          </div>
          {uploadedLabel && <div>Yuklangan vaqt: {uploadedLabel}</div>}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {onReplaceReceipt && (
            <button
              type="button"
              onClick={onReplaceReceipt}
              className="px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              style={{ borderColor: 'var(--dx-border)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Almashtirish
            </button>
          )}
          <a
            href={order.receiptUrl}
            download={`chek-${order.id.slice(0, 6).toLowerCase()}.jpg`}
            className="px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          >
            <Download className="w-3.5 h-3.5" /> Yuklab olish
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
