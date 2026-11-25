import React, { useState } from 'react';
import { CustomerOrderCard } from '../../components/customer/CustomerOrderCard';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { getReadableErrorMessage } from '../../services/errors';

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
      setActionError(getReadableErrorMessage(err, 'Buyurtmani bekor qilib bo‘lmadi.'));
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Buyurtmalarim</h1>

      <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
        {(
          [
            ['active', `Faol (${activeOrders.length})`],
            ['history', `Tarix (${historyOrders.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSegment(key)}
            className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            style={{
              backgroundColor: segment === key ? 'var(--dx-primary)' : 'var(--dx-surface)',
              color: segment === key ? 'var(--dx-on-primary)' : 'var(--dx-text)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
          }}
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
            <CustomerOrderCard
              key={order.id}
              order={order}
              onCancel={(id) => void handleCancel(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
