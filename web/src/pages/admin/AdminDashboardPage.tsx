import React, { useState } from 'react';
import { Check, Store, X } from 'lucide-react';
import { useAdminBusinesses } from '../../hooks/useAdminBusinesses';
import { useAuth } from '../../hooks/useAuth';
import { BUSINESS_TYPES, type Business } from '../../types/domain';

export const AdminDashboardPage: React.FC = () => {
  const { session } = useAuth();
  const isAdmin = session.status === 'ready' && session.profile.role === 'admin';
  const {
    businesses,
    pendingBusinesses,
    approvedBusinesses,
    rejectedBusinesses,
    loading,
    error,
    approveBusiness,
    rejectBusiness,
  } = useAdminBusinesses(isAdmin);

  const [tab, setTab] = useState<'approvals' | 'all'>('approvals');
  const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
  const [reason, setReason] = useState('');
  const [actionErr, setActionErr] = useState<string | null>(null);

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    setActionErr(null);
    try {
      await rejectBusiness(rejectTarget.id, reason);
      setRejectTarget(null);
      setReason('');
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : 'Rad etishda xatolik.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Administrator Paneli</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <AdminKpi title="Tasdiq kutmoqda" value={`${pendingBusinesses.length} ta`} color="var(--dx-primary)" />
        <AdminKpi title="Tasdiqlangan" value={`${approvedBusinesses.length} ta`} color="var(--dx-tertiary)" />
        <AdminKpi title="Rad etilgan" value={`${rejectedBusinesses.length} ta`} color="var(--dx-error)" />
        <AdminKpi title="Jami bizneslar" value={`${businesses.length} ta`} />
      </div>

      <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
        <button
          type="button"
          onClick={() => setTab('approvals')}
          className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{
            backgroundColor: tab === 'approvals' ? 'var(--dx-primary)' : 'var(--dx-surface)',
            color: tab === 'approvals' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
          }}
        >
          Tasdiq kutayotganlar ({pendingBusinesses.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{
            backgroundColor: tab === 'all' ? 'var(--dx-primary)' : 'var(--dx-surface)',
            color: tab === 'all' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
          }}
        >
          Barcha bizneslar ({businesses.length})
        </button>
      </div>

      {(error || actionErr) && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{ backgroundColor: 'var(--dx-error-container)', color: 'var(--dx-on-error-container)' }}
        >
          {actionErr ?? error}
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--dx-muted)' }}>
          Bizneslar yuklanmoqda…
        </div>
      ) : tab === 'approvals' ? (
        pendingBusinesses.length === 0 ? (
          <div
            className="rounded-3xl p-10 text-center border"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="font-bold text-sm">Tasdiq kutayotgan arizalar yo‘q</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBusinesses.map((biz) => {
              const meta = BUSINESS_TYPES.find((bt) => bt.storedValue === biz.type);
              return (
                <div
                  key={biz.id}
                  className="p-5 rounded-2xl border space-y-3"
                  style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-base">{biz.name}</div>
                      <div className="text-xs" style={{ color: 'var(--dx-secondary)' }}>
                        {meta?.icon} {meta?.labelUz}
                        {biz.typeNote ? ` (${biz.typeNote})` : ''}
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg"
                      style={{
                        backgroundColor: 'var(--dx-primary-container)',
                        color: 'var(--dx-on-primary-container)',
                      }}
                    >
                      Kutilmoqda
                    </span>
                  </div>
                  <div className="text-xs space-y-1" style={{ color: 'var(--dx-muted)' }}>
                    <div>📍 {biz.address}</div>
                    <div>📞 {biz.phone}</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void approveBusiness(biz.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                    >
                      <Check className="w-3.5 h-3.5" /> Tasdiqlash
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectTarget(biz);
                        setReason('');
                        setActionErr(null);
                      }}
                      className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                      style={{ borderColor: 'var(--dx-error)', color: 'var(--dx-error)' }}
                    >
                      Rad etish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {businesses.map((biz) => (
            <div
              key={biz.id}
              className="p-4 rounded-2xl border flex items-center justify-between gap-3"
              style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--dx-primary-container)',
                    color: 'var(--dx-on-primary-container)',
                  }}
                >
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{biz.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--dx-muted)' }}>
                    {biz.address}
                  </div>
                  {biz.rejectionReason && (
                    <div className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--dx-error)' }}>
                      Sabab: {biz.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                style={{
                  backgroundColor:
                    biz.status === 'approved'
                      ? 'var(--dx-tertiary-container)'
                      : biz.status === 'rejected'
                        ? 'var(--dx-error-container)'
                        : 'var(--dx-primary-container)',
                  color:
                    biz.status === 'approved'
                      ? 'var(--dx-on-tertiary-container)'
                      : biz.status === 'rejected'
                        ? 'var(--dx-on-error-container)'
                        : 'var(--dx-on-primary-container)',
                }}
              >
                {biz.status === 'approved'
                  ? 'Tasdiqlangan'
                  : biz.status === 'rejected'
                    ? 'Rad etilgan'
                    : 'Kutilmoqda'}
              </span>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleReject}
            className="w-full max-w-sm rounded-3xl border p-6 space-y-4"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Biznesni rad etish</h2>
              <button type="button" onClick={() => setRejectTarget(null)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
              {rejectTarget.name}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Rad etish sababini kiriting (kamida 3 belgi)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                style={{ borderColor: 'var(--dx-border)' }}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={reason.trim().length < 3}
                className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-error)', color: '#fff' }}
              >
                Rad etish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const AdminKpi: React.FC<{ title: string; value: string; color?: string }> = ({
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
