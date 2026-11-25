import React, { useState } from 'react';
import { StatusChip } from '../../components/StatusChip';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { formatSoM } from '../../services/analytics';

export const CustomerOrdersPage: React.FC = () => {
  const { session } = useAuth();
  const uid = session.status === 'ready' ? session.profile.uid : undefined;
  const { activeOrders, historyOrders, loading, error, cancelOrder } = useCustomerOrders(uid);
  const [segment, setSegment] = useState<'active' | 'history'>('active');
  const [actionError, setActionError] = useState<string | null>(null);

  const list = segment === 'active' ? activeOrders : historyOrders;

  const handleCancel = async (orderId: string) => {
    setActionError(null);
    try {
      await cancelOrder(orderId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Buyurtmani bekor qilib bo‘lmadi.');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Buyurtmalarim</h1>

      <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
        <button
          type="button"
          onClick={() => setSegment('active')}
          className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{
            backgroundColor: segment === 'active' ? 'var(--dx-primary)' : 'var(--dx-surface)',
            color: segment === 'active' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
          }}
        >
          Faol ({activeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setSegment('history')}
          className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{
            backgroundColor: segment === 'history' ? 'var(--dx-primary)' : 'var(--dx-surface)',
            color: segment === 'history' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
          }}
        >
          Tarix ({historyOrders.length})
        </button>
      </div>

      {(error || actionError) && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{ backgroundColor: 'var(--dx-error-container)', color: 'var(--dx-on-error-container)' }}
        >
          {actionError ?? error}
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--dx-muted)' }}>
          Buyurtmalar yuklanmoqda…
        </div>
      ) : list.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center border"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="text-3xl mb-2">🛒</div>
          <div className="font-bold text-sm">
            {segment === 'active'
              ? 'Faol buyurtmalaringiz yo‘q.'
              : 'Buyurtmalar tarixi hozircha bo‘sh.'}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {list.map((order) => (
            <div
              key={order.id}
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
                  {(['pending', 'accepted', 'ready', 'completed'] as const).map((step, idx) => {
                    const rank = { pending: 0, accepted: 1, ready: 2, completed: 3 };
                    const reached = (rank[order.status as keyof typeof rank] ?? 0) >= idx;
                    const labels = {
                      pending: 'Kutilmoqda',
                      accepted: 'Qabul',
                      ready: 'Tayyor',
                      completed: 'Yakun',
                    };
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
                          {labels[step]}
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
                  <span>
                    To‘lov: {order.paymentStatus === 'paid' ? '✅ To‘langan' : '⏳ Joyida'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
                    {formatSoM(order.totalPrice)}
                  </span>
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => void handleCancel(order.id)}
                      className="px-3 py-1 rounded-xl border text-xs font-bold cursor-pointer"
                      style={{ borderColor: 'var(--dx-error)', color: 'var(--dx-error)' }}
                    >
                      Bekor qilish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
