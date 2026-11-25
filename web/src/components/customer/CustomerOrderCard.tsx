import React from 'react';
import { StatusChip } from '../StatusChip';
import { formatSoM } from '../../services/analytics';
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
}

export const CustomerOrderCard: React.FC<CustomerOrderCardProps> = ({ order, onCancel }) => (
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

    <div
      className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs"
      style={{ borderColor: 'var(--dx-border)' }}
    >
      <div className="flex flex-wrap gap-3" style={{ color: 'var(--dx-muted)' }}>
        <span>
          {order.fulfillmentType === 'delivery'
            ? `🚚 Yetkazish: ${order.deliveryAddress}`
            : '🛍️ Olib ketish'}
        </span>
        <span>To‘lov: {order.paymentStatus === 'paid' ? '✅ To‘langan' : '⏳ Joyida'}</span>
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
