import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { StatusChip } from '../../components/StatusChip';
import { formatSoM } from '../../services/analytics';
import { TERMINAL_ORDER_STATUSES } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import type { CustomerOrder, OrderStatusKey, PaymentStatus } from '../../types/domain';
import type { OwnerContextType } from './OwnerLayout';

const NEXT_ORDER_STEP: Partial<Record<OrderStatusKey, { next: OrderStatusKey; label: string }>> = {
  pending: { next: 'accepted', label: 'Qabul qilish' },
  accepted: { next: 'ready', label: 'Tayyor' },
  ready: { next: 'completed', label: 'Yakunlash' },
};

export const OwnerOrdersPage: React.FC = () => {
  const { orders, advanceOrder, rejectOrder, setPaymentStatus } =
    useOutletContext<OwnerContextType>();
  const [segment, setSegment] = useState<'new' | 'progress' | 'history'>('new');
  const [actionError, setActionError] = useState<string | null>(null);

  const newOrders = orders.filter((o) => o.status === 'pending');
  const progressOrders = orders.filter((o) => o.status === 'accepted' || o.status === 'ready');
  const historyOrders = orders.filter((o) => TERMINAL_ORDER_STATUSES.includes(o.status));
  const list =
    segment === 'new' ? newOrders : segment === 'progress' ? progressOrders : historyOrders;

  const runAction = async (work: () => Promise<void>) => {
    setActionError(null);
    try {
      await work();
    } catch (err) {
      setActionError(getReadableErrorMessage(err, 'Buyurtmani yangilab bo‘lmadi.'));
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold">Buyurtmalar ({orders.length})</h1>

      {actionError && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
          }}
        >
          {actionError}
        </div>
      )}

      <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
        {(
          [
            ['new', `Yangi (${newOrders.length})`],
            ['progress', `Jarayonda (${progressOrders.length})`],
            ['history', `Tarix (${historyOrders.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSegment(key)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
            style={{
              backgroundColor: segment === key ? 'var(--dx-primary)' : 'var(--dx-surface)',
              color: segment === key ? 'var(--dx-on-primary)' : 'var(--dx-text)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center border"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="font-bold text-sm">Bu bo‘limda buyurtmalar yo‘q</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((order) => (
            <OwnerOrderCard
              key={order.id}
              order={order}
              onTogglePayment={(id, next) => void runAction(() => setPaymentStatus(id, next))}
              onAdvance={(id, prodId, next) => void runAction(() => advanceOrder(id, prodId, next))}
              onReject={(id) => void runAction(() => rejectOrder(id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const OwnerOrderCard: React.FC<{
  order: CustomerOrder;
  onTogglePayment: (orderId: string, next: PaymentStatus) => void;
  onAdvance: (orderId: string, productId: string, next: OrderStatusKey) => void;
  onReject: (orderId: string) => void;
}> = ({ order, onTogglePayment, onAdvance, onReject }) => {
  const nextStep = NEXT_ORDER_STEP[order.status];

  return (
    <div
      className="p-4 rounded-2xl border space-y-3"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold" style={{ color: 'var(--dx-muted)' }}>
            #{order.id.slice(0, 6).toUpperCase()} · {order.customerName || 'Xaridor'}
          </div>
          <div className="font-bold text-sm mt-0.5">
            {order.productName} ({order.quantity} ta)
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--dx-muted)' }}>
            {order.fulfillmentType === 'delivery'
              ? `🚚 ${order.deliveryAddress}`
              : '🛍️ Olib ketish'}{' '}
            · {order.customerPhone}
          </div>
        </div>
        <StatusChip status={order.status} />
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs"
        style={{ borderColor: 'var(--dx-border)' }}
      >
        <span className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
          {formatSoM(order.totalPrice)}
        </span>

        <div className="flex flex-wrap gap-1.5">
          {!TERMINAL_ORDER_STATUSES.includes(order.status) && (
            <button
              type="button"
              onClick={() =>
                onTogglePayment(order.id, order.paymentStatus === 'paid' ? 'unpaid' : 'paid')
              }
              className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
              style={{
                backgroundColor:
                  order.paymentStatus === 'paid' ? 'var(--dx-tertiary-container)' : 'var(--dx-bg)',
                borderColor: 'var(--dx-border)',
                color:
                  order.paymentStatus === 'paid'
                    ? 'var(--dx-on-tertiary-container)'
                    : 'var(--dx-text)',
              }}
            >
              {order.paymentStatus === 'paid' ? '✅ To‘langan' : 'To‘lovni tasdiqlash'}
            </button>
          )}

          {nextStep && (
            <button
              type="button"
              onClick={() => onAdvance(order.id, order.productId, nextStep.next)}
              className="px-3 py-1 rounded-xl font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              {nextStep.label}
            </button>
          )}

          {order.status === 'pending' && (
            <button
              type="button"
              onClick={() => onReject(order.id)}
              className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
              style={{ borderColor: 'var(--dx-error)', color: 'var(--dx-error)' }}
            >
              Rad etish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
