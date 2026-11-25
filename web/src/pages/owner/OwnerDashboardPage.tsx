import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Package, TrendingUp } from 'lucide-react';
import { BusinessEditModal } from '../../components/owner/BusinessEditModal';
import { StatusChip } from '../../components/StatusChip';
import { formatSoM } from '../../services/analytics';
import { IN_PROGRESS_ORDER_STATUSES, LOW_STOCK_THRESHOLD } from '../../services/constants';
import {
  BUSINESS_TYPES,
  type CustomerOrder,
  type OrderStatusKey,
  type PaymentStatus,
} from '../../types/domain';
import type { OwnerContextType } from './OwnerLayout';

export const OwnerDashboardPage: React.FC = () => {
  const {
    business,
    products,
    orders,
    report,
    advanceOrder,
    rejectOrder,
    setPaymentStatus,
    updateBusiness,
    error,
  } = useOutletContext<OwnerContextType>();

  const [editOpen, setEditOpen] = useState(false);
  if (!business) return null;

  const businessMeta = BUSINESS_TYPES.find((bt) => bt.storedValue === business.type);
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeCount = orders.filter((o) => IN_PROGRESS_ORDER_STATUSES.includes(o.status)).length;
  const lowStockCount = products.filter(
    (p) => p.stock !== null && p.stock < LOW_STOCK_THRESHOLD
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{business.name}</h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--dx-muted)' }}>
            {businessMeta?.icon} {businessMeta?.labelUz} · {business.address}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          Biznesni tahrirlash
        </button>
      </div>

      {error && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard title="Jami buyurtmalar" value={`${orders.length} ta`} />
        <StatCard
          title="Haftalik tushum (paid)"
          value={formatSoM(report.totalRevenue)}
          color="var(--dx-primary)"
        />
        <StatCard
          title="Faol buyurtmalar"
          value={`${activeCount} ta`}
          color="var(--dx-secondary)"
        />
        <StatCard
          title="Kam qolgan (<5)"
          value={`${lowStockCount} ta`}
          color={lowStockCount > 0 ? 'var(--dx-error)' : 'var(--dx-tertiary)'}
        />
      </div>

      <DashboardShortcuts productCount={products.length} />

      {pendingOrders.length > 0 && (
        <PendingOrdersSection
          orders={pendingOrders}
          onSetPayment={setPaymentStatus}
          onAdvance={advanceOrder}
          onReject={rejectOrder}
        />
      )}

      {editOpen && (
        <BusinessEditModal
          business={business}
          onClose={() => setEditOpen(false)}
          onSave={updateBusiness}
        />
      )}
    </div>
  );
};

const DashboardShortcuts: React.FC<{ productCount: number }> = ({ productCount }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <Link
      to="/owner/products"
      className="p-4 rounded-2xl border flex items-center justify-between font-bold text-sm"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <span className="inline-flex items-center gap-2">
        <Package className="w-4 h-4" style={{ color: 'var(--dx-primary)' }} /> Mahsulotlarni
        boshqarish ({productCount})
      </span>
      <span>→</span>
    </Link>
    <Link
      to="/owner/analytics"
      className="p-4 rounded-2xl border flex items-center justify-between font-bold text-sm"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <span className="inline-flex items-center gap-2">
        <TrendingUp className="w-4 h-4" style={{ color: 'var(--dx-secondary)' }} /> Daromad va foyda
        tahlili
      </span>
      <span>→</span>
    </Link>
  </div>
);

const PendingOrdersSection: React.FC<{
  orders: CustomerOrder[];
  onSetPayment: (orderId: string, status: PaymentStatus) => Promise<void>;
  onAdvance: (orderId: string, productId: string, nextStatus: OrderStatusKey) => Promise<void>;
  onReject: (orderId: string) => Promise<void>;
}> = ({ orders, onSetPayment, onAdvance, onReject }) => (
  <div className="space-y-3">
    <h2 className="font-bold text-base">Diqqat talab qiladi ({orders.length})</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {orders.map((order) => (
        <div
          key={order.id}
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold" style={{ color: 'var(--dx-muted)' }}>
                {order.customerName || 'Xaridor'} · {order.customerPhone}
              </div>
              <div className="font-bold text-sm">
                {order.productName} ({order.quantity} ta)
              </div>
            </div>
            <StatusChip status={order.status} />
          </div>
          <div
            className="flex items-center justify-between pt-2 border-t text-xs"
            style={{ borderColor: 'var(--dx-border)' }}
          >
            <span className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
              {formatSoM(order.totalPrice)}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  void onSetPayment(order.id, order.paymentStatus === 'paid' ? 'unpaid' : 'paid')
                }
                className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
                style={{ borderColor: 'var(--dx-border)' }}
              >
                {order.paymentStatus === 'paid' ? '✅ To‘langan' : 'To‘lovni belgilash'}
              </button>
              <button
                type="button"
                onClick={() => void onAdvance(order.id, order.productId, 'accepted')}
                className="px-3 py-1 rounded-xl font-bold cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                Qabul qilish
              </button>
              <button
                type="button"
                onClick={() => void onReject(order.id)}
                className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
                style={{ borderColor: 'var(--dx-error)', color: 'var(--dx-error)' }}
              >
                Rad etish
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatCard: React.FC<{ title: string; value: string; color?: string }> = ({
  title,
  value,
  color,
}) => (
  <div
    className="p-4 rounded-2xl border space-y-1"
    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
  >
    <div className="text-[11px] font-bold" style={{ color: 'var(--dx-muted)' }}>
      {title}
    </div>
    <div className="text-lg sm:text-xl font-extrabold" style={{ color: color ?? 'var(--dx-text)' }}>
      {value}
    </div>
  </div>
);
