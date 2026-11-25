import React from 'react';
import type { OrderStatusKey } from '../types/dasturxon';

interface StatusChipProps {
  status: OrderStatusKey;
}

const STATUS_STYLE: Record<
  OrderStatusKey,
  { label: string; icon: string; bg: string; fg: string }
> = {
  pending: { label: 'Kutilmoqda', icon: '◷', bg: '#FFF3CD', fg: '#856404' },
  accepted: { label: 'Qabul qilindi', icon: '✓', bg: '#CCE5FF', fg: '#004085' },
  ready: { label: 'Tayyor', icon: '✓✓', bg: '#D4EDDA', fg: '#155724' },
  completed: { label: 'Yakunlandi', icon: '✓', bg: '#E0F2F1', fg: '#004D40' },
  rejected: { label: 'Rad etildi', icon: '!', bg: '#F8D7DA', fg: '#721C24' },
  cancelled: { label: 'Bekor qilindi', icon: '×', bg: '#E2E3E5', fg: '#495057' },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const meta = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold whitespace-nowrap"
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
};
