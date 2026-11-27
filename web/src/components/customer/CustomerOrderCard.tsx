import React from 'react';
import { ReceiptText, Upload } from 'lucide-react';
import { StatusChip } from '../StatusChip';
import { formatSoM } from '../../services/analytics';
import { calculateOrderPrepayment } from '../../services/orderLogic';
import type { CustomerOrder } from '../../types/domain';

const PROGRESS_STEPS = [
  ['pending', 'Kutilmoqda'],
  ['accepted', 'Qabul'],
  ['ready', 'Tayyor'],
  ['completed', 'Yakun'],
] as const;

const STEP_RANK: Record<string, number> = {
  pending: 0,
  accepted: 1,
  ready: 2,
  completed: 3,
};

interface CustomerOrderCardProps {
  order: CustomerOrder;
  onCancel: (orderId: string) => void;
  onViewReceipt?: (order: CustomerOrder, kind: 'full' | 'advance') => void;
  onUploadAdvance?: (order: CustomerOrder) => void;
}

const CustomerAdvanceBanner: React.FC<{
  order: CustomerOrder;
  onViewAdvance?: () => void;
  onUploadAdvance?: () => void;
}> = ({ order, onViewAdvance, onUploadAdvance }) => {
  if (
    order.paymentStatus === 'paid' ||
    ['rejected', 'cancelled', 'completed'].includes(order.status)
  ) {
    return null;
  }
  const adv = order.prepaymentAmount ?? calculateOrderPrepayment(order.totalPrice).prepaymentAmount;
  const rem = Math.max(0, order.totalPrice - adv);
  const status = order.prepaymentStatus ?? 'awaiting_advance';
  const canUpload = ['pending', 'accepted'].includes(order.status) && status !== 'advance_paid';

  const statusText =
    status === 'advance_paid'
      ? `✅ 50% avans tasdiqlangan (${formatSoM(adv)}) · Qolgan 50%: ${formatSoM(rem)}`
      : status === 'advance_submitted'
        ? `⏳ 50% avans cheki yuborildi (${formatSoM(adv)}) — do‘kon tekshirmoqda`
        : `💳 50% avans to‘lanishi kerak: ${formatSoM(adv)} (qolgani: ${formatSoM(rem)})`;

  return (
    <div
      className="p-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2"
      style={{
        backgroundColor:
          status === 'advance_paid'
            ? 'var(--dx-tertiary-container)'
            : 'var(--dx-secondary-container)',
        borderColor: 'var(--dx-border)',
      }}
    >
      <span className="font-bold">{statusText}</span>
      <div className="flex flex-wrap gap-1.5">
        {order.advanceReceiptUrl && onViewAdvance && (
          <button
            type="button"
            onClick={onViewAdvance}
            className="px-2.5 py-1 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          >
            <ReceiptText className="w-3 h-3" /> Avans cheki
          </button>
        )}
        {canUpload && onUploadAdvance && (
          <button
            type="button"
            onClick={onUploadAdvance}
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            <Upload className="w-3 h-3" />{' '}
            {status === 'advance_submitted' ? 'Chekni almashtirish' : '50% Avans chekini yuklash'}
          </button>
        )}
      </div>
    </div>
  );
};

export const CustomerOrderCard: React.FC<CustomerOrderCardProps> = ({
  order,
  onCancel,
  onViewReceipt,
  onUploadAdvance,
}) => (
  <div
    className="p-4 sm:p-5 rounded-2xl border space-y-3"
    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
  >
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <div className="text-xs font-bold" style={{ color: 'var(--dx-muted)' }}>
          #{order.id.slice(0, 6).toUpperCase()} · {order.businessName}
        </div>
        <div className="font-bold text-base mt-0.5">
          {order.productName} ({order.quantity} dona)
        </div>
      </div>
      <StatusChip status={order.status} />
    </div>

    {!['rejected', 'cancelled'].includes(order.status) && (
      <div className="grid grid-cols-4 gap-1.5">
        {PROGRESS_STEPS.map(([step, label], idx) => {
          const reached = (STEP_RANK[order.status] ?? 0) >= idx;
          return (
            <div key={step} className="space-y-1">
              <div
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor: reached ? 'var(--dx-tertiary)' : 'var(--dx-surface-variant)',
                }}
              />
              <div
                className="text-[10px] font-bold text-center"
                style={{ color: reached ? 'var(--dx-tertiary)' : 'var(--dx-muted)' }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    )}

    <CustomerAdvanceBanner
      order={order}
      onViewAdvance={onViewReceipt ? () => onViewReceipt(order, 'advance') : undefined}
      onUploadAdvance={onUploadAdvance ? () => onUploadAdvance(order) : undefined}
    />

    <div
      className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs"
      style={{ borderColor: 'var(--dx-border)' }}
    >
      <div className="flex flex-wrap items-center gap-3" style={{ color: 'var(--dx-muted)' }}>
        <span>
          {order.fulfillmentType === 'delivery'
            ? `🚚 Yetkazish: ${order.deliveryAddress}`
            : '🛍️ Olib ketish'}
        </span>
        <span>
          To‘lov:{' '}
          {order.paymentStatus === 'paid'
            ? '✅ To‘liq to‘langan'
            : order.prepaymentStatus === 'advance_paid'
              ? '🌓 50% avans to‘langan'
              : '⏳ Avans kutilmoqda'}
        </span>
        {order.paymentStatus === 'paid' && order.receiptUrl && onViewReceipt && (
          <button
            type="button"
            onClick={() => onViewReceipt(order, 'full')}
            className="px-2.5 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            style={{
              backgroundColor: 'var(--dx-bg)',
              borderColor: 'var(--dx-border)',
              color: 'var(--dx-primary)',
            }}
          >
            <ReceiptText className="w-3.5 h-3.5" /> Chekni ko‘rish
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
          {formatSoM(order.totalPrice)}
        </span>
        {order.status === 'pending' && (
          <button
            type="button"
            onClick={() => onCancel(order.id)}
            className="px-3 py-1 rounded-xl border text-xs font-bold cursor-pointer"
            style={{ borderColor: 'var(--dx-error)', color: 'var(--dx-error)' }}
          >
            Bekor qilish
          </button>
        )}
      </div>
    </div>
  </div>
);
