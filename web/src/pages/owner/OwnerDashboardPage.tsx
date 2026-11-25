import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Package, TrendingUp, X } from 'lucide-react';
import { StatusChip } from '../../components/StatusChip';
import { formatSoM } from '../../services/analytics';
import { validateBusinessForm } from '../../services/validators';
import { BUSINESS_TYPES, type BusinessTypeKey } from '../../types/domain';
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
  const [bName, setBName] = useState(business?.name ?? '');
  const [bType, setBType] = useState<BusinessTypeKey>(business?.type ?? 'bakery');
  const [bNote, setBNote] = useState(business?.typeNote ?? '');
  const [bAddr, setBAddr] = useState(business?.address ?? '');
  const [bPhone, setBPhone] = useState(business?.phone ?? '');
  const [formErr, setFormErr] = useState<string | null>(null);

  if (!business) return null;

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeCount = orders.filter((o) => ['pending', 'accepted', 'ready'].includes(o.status)).length;
  const lowStockCount = products.filter((p) => p.stock !== null && p.stock < 5).length;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    const check = validateBusinessForm({
      name: bName,
      type: bType,
      typeNote: bNote,
      address: bAddr,
      phone: bPhone,
    });
    if (!check.valid) {
      setFormErr(check.error ?? 'Tekshiring.');
      return;
    }
    await updateBusiness({ name: bName, type: bType, address: bAddr, phone: bPhone, typeNote: bNote });
    setEditOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{business.name}</h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--dx-muted)' }}>
            {BUSINESS_TYPES.find((bt) => bt.storedValue === business.type)?.icon}{' '}
            {BUSINESS_TYPES.find((bt) => bt.storedValue === business.type)?.labelUz} · {business.address}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setBName(business.name);
            setBType(business.type);
            setBNote(business.typeNote ?? '');
            setBAddr(business.address);
            setBPhone(business.phone);
            setEditOpen(true);
          }}
          className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          Biznesni tahrirlash
        </button>
      </div>

      {error && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{ backgroundColor: 'var(--dx-error-container)', color: 'var(--dx-on-error-container)' }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard title="Jami buyurtmalar" value={`${orders.length} ta`} />
        <StatCard title="Haftalik tushum (paid)" value={formatSoM(report.totalRevenue)} color="var(--dx-primary)" />
        <StatCard title="Faol buyurtmalar" value={`${activeCount} ta`} color="var(--dx-secondary)" />
        <StatCard
          title="Kam qolgan (<5)"
          value={`${lowStockCount} ta`}
          color={lowStockCount > 0 ? 'var(--dx-error)' : 'var(--dx-tertiary)'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/owner/products"
          className="p-4 rounded-2xl border flex items-center justify-between font-bold text-sm"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <span className="inline-flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: 'var(--dx-primary)' }} /> Mahsulotlarni boshqarish ({products.length})
          </span>
          <span>→</span>
        </Link>
        <Link
          to="/owner/analytics"
          className="p-4 rounded-2xl border flex items-center justify-between font-bold text-sm"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <span className="inline-flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--dx-secondary)' }} /> Daromad va foyda tahlili
          </span>
          <span>→</span>
        </Link>
      </div>

      {pendingOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-base">Diqqat talab qiladi ({pendingOrders.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingOrders.map((order) => (
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
                <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: 'var(--dx-border)' }}>
                  <span className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
                    {formatSoM(order.totalPrice)}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void setPaymentStatus(order.id, order.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                      className="px-2.5 py-1 rounded-xl border font-bold cursor-pointer"
                      style={{ borderColor: 'var(--dx-border)' }}
                    >
                      {order.paymentStatus === 'paid' ? '✅ To‘langan' : 'To‘lovni belgilash'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void advanceOrder(order.id, order.productId, 'accepted')}
                      className="px-3 py-1 rounded-xl font-bold cursor-pointer"
                      style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                    >
                      Qabul qilish
                    </button>
                    <button
                      type="button"
                      onClick={() => void rejectOrder(order.id)}
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
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md rounded-3xl border p-6 space-y-3.5"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Biznes ma’lumotlari</h2>
              <button type="button" onClick={() => setEditOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              placeholder="Biznes nomi"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <select
              value={bType}
              onChange={(e) => setBType(e.target.value as BusinessTypeKey)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.storedValue} value={bt.storedValue}>
                  {bt.icon} {bt.labelUz}
                </option>
              ))}
            </select>
            {bType === 'other' && (
              <input
                value={bNote}
                onChange={(e) => setBNote(e.target.value)}
                placeholder="Boshqa tur izohi (3-40 belgi)"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
              />
            )}
            <input
              value={bAddr}
              onChange={(e) => setBAddr(e.target.value)}
              placeholder="Manzil"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <input
              value={bPhone}
              onChange={(e) => setBPhone(e.target.value)}
              placeholder="Telefon"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            {formErr && (
              <div className="text-xs font-bold" style={{ color: 'var(--dx-error)' }}>
                {formErr}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl text-sm font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              Saqlash
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

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
