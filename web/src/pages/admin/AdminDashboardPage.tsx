import React, { useState } from 'react';
import { Check, Store } from 'lucide-react';
import { RejectBusinessModal } from '../../components/admin/RejectBusinessModal';
import { useAdminBusinesses } from '../../hooks/useAdminBusinesses';
import { useAuth } from '../../hooks/useAuth';
import { getReadableErrorMessage } from '../../services/errors';
import { BUSINESS_TYPES, type Business, type BusinessStatus } from '../../types/domain';

const STATUS_BADGE: Record<BusinessStatus, { label: string; bg: string; fg: string }> = {
  approved: {
    label: 'Tasdiqlangan',
    bg: 'var(--dx-tertiary-container)',
    fg: 'var(--dx-on-tertiary-container)',
  },
  rejected: {
    label: 'Rad etilgan',
    bg: 'var(--dx-error-container)',
    fg: 'var(--dx-on-error-container)',
  },
  pending: {
    label: 'Kutilmoqda',
    bg: 'var(--dx-primary-container)',
    fg: 'var(--dx-on-primary-container)',
  },
  suspended: {
    label: 'To‘xtatilgan',
    bg: 'var(--dx-surface-variant)',
    fg: 'var(--dx-muted)',
  },
};

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
  const [actionErr, setActionErr] = useState<string | null>(null);

  const handleApprove = async (businessId: string) => {
    setActionErr(null);
    try {
      await approveBusiness(businessId);
    } catch (err) {
      setActionErr(getReadableErrorMessage(err, 'Tasdiqlashda xatolik.'));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Administrator Paneli</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <AdminKpi
          title="Tasdiq kutmoqda"
          value={`${pendingBusinesses.length} ta`}
          color="var(--dx-primary)"
        />
        <AdminKpi
          title="Tasdiqlangan"
          value={`${approvedBusinesses.length} ta`}
          color="var(--dx-tertiary)"
        />
        <AdminKpi
          title="Rad etilgan"
          value={`${rejectedBusinesses.length} ta`}
          color="var(--dx-error)"
        />
        <AdminKpi title="Jami bizneslar" value={`${businesses.length} ta`} />
      </div>

      <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
        {(
          [
            ['approvals', `Tasdiq kutayotganlar (${pendingBusinesses.length})`],
            ['all', `Barcha bizneslar (${businesses.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            style={{
              backgroundColor: tab === key ? 'var(--dx-primary)' : 'var(--dx-surface)',
              color: tab === key ? 'var(--dx-on-primary)' : 'var(--dx-text)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {(error || actionErr) && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
          }}
        >
          {actionErr ?? error}
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--dx-muted)' }}>
          Bizneslar yuklanmoqda…
        </div>
      ) : tab === 'approvals' ? (
        <PendingBusinessList
          businesses={pendingBusinesses}
          onApprove={(id) => void handleApprove(id)}
          onSelectReject={(biz) => {
            setRejectTarget(biz);
            setActionErr(null);
          }}
        />
      ) : (
        <AllBusinessList businesses={businesses} />
      )}

      {rejectTarget && (
        <RejectBusinessModal
          business={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirmReject={rejectBusiness}
        />
      )}
    </div>
  );
};

const PendingBusinessList: React.FC<{
  businesses: Business[];
  onApprove: (id: string) => void;
  onSelectReject: (biz: Business) => void;
}> = ({ businesses, onApprove, onSelectReject }) => {
  if (businesses.length === 0) {
    return (
      <div
        className="rounded-3xl p-10 text-center border"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="text-3xl mb-2">✅</div>
        <div className="font-bold text-sm">Tasdiq kutayotgan arizalar yo‘q</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {businesses.map((biz) => {
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
                onClick={() => onApprove(biz.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                <Check className="w-3.5 h-3.5" /> Tasdiqlash
              </button>
              <button
                type="button"
                onClick={() => onSelectReject(biz)}
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
  );
};

const AllBusinessList: React.FC<{ businesses: Business[] }> = ({ businesses }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
    {businesses.map((biz) => {
      const badge = STATUS_BADGE[biz.status];
      return (
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
            style={{ backgroundColor: badge.bg, color: badge.fg }}
          >
            {badge.label}
          </span>
        </div>
      );
    })}
  </div>
);

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
