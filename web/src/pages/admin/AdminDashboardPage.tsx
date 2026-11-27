import React, { useState } from 'react';
import { Check, Edit3, MessageSquareText, PhoneCall, Store } from 'lucide-react';
import { AdminBusinessReviewModal } from '../../components/admin/AdminBusinessReviewModal';
import { RejectBusinessModal } from '../../components/admin/RejectBusinessModal';
import { useAdminBusinesses } from '../../hooks/useAdminBusinesses';
import { useAuth } from '../../hooks/useAuth';
import { getReadableErrorMessage } from '../../services/errors';
import { buildSmsHref, buildTelHref } from '../../services/validators';
import {
  BUSINESS_TYPES,
  type Business,
  type BusinessStatus,
  type OwnerInquiry,
} from '../../types/domain';

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

const AdminSummaryHeader: React.FC<{
  pendingCount: number;
  waitingInqCount: number;
  approvedCount: number;
  totalCount: number;
  tab: 'approvals' | 'inquiries' | 'all';
  totalInqCount: number;
  onTabChange: (t: 'approvals' | 'inquiries' | 'all') => void;
}> = ({
  pendingCount,
  waitingInqCount,
  approvedCount,
  totalCount,
  tab,
  totalInqCount,
  onTabChange,
}) => (
  <>
    <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Administrator Paneli</h1>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <AdminKpi title="Tasdiq kutmoqda" value={`${pendingCount} ta`} color="var(--dx-primary)" />
      <AdminKpi
        title="Yangi murojaatlar"
        value={`${waitingInqCount} ta`}
        color="var(--dx-secondary)"
      />
      <AdminKpi title="Tasdiqlangan" value={`${approvedCount} ta`} color="var(--dx-tertiary)" />
      <AdminKpi title="Jami bizneslar" value={`${totalCount} ta`} />
    </div>
    <div className="flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
      {(
        [
          ['approvals', `Tasdiq kutayotganlar (${pendingCount})`],
          ['inquiries', `Murojaatlar (${totalInqCount})`],
          ['all', `Barcha bizneslar (${totalCount})`],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
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
  </>
);

export const AdminDashboardPage: React.FC = () => {
  const { session } = useAuth();
  const isAdmin = session.status === 'ready' && session.profile.role === 'admin';
  const {
    businesses,
    pendingBusinesses,
    approvedBusinesses,
    inquiries,
    waitingInquiries,
    loading,
    error,
    approveBusiness,
    rejectBusiness,
    saveBusinessDetails,
    createBusinessForOwner,
    updateInquiry,
  } = useAdminBusinesses(isAdmin);

  const [tab, setTab] = useState<'approvals' | 'inquiries' | 'all'>('approvals');
  const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
  const [reviewTarget, setReviewTarget] = useState<
    { kind: 'business'; item: Business } | { kind: 'inquiry'; item: OwnerInquiry } | null
  >(null);
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
      <AdminSummaryHeader
        pendingCount={pendingBusinesses.length}
        waitingInqCount={waitingInquiries.length}
        approvedCount={approvedBusinesses.length}
        totalCount={businesses.length}
        tab={tab}
        totalInqCount={inquiries.length}
        onTabChange={setTab}
      />

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
          Ma’lumotlar yuklanmoqda…
        </div>
      ) : tab === 'approvals' ? (
        <PendingBusinessList
          businesses={pendingBusinesses}
          onApprove={(id) => void handleApprove(id)}
          onReview={(biz) => setReviewTarget({ kind: 'business', item: biz })}
          onSelectReject={(biz) => {
            setRejectTarget(biz);
            setActionErr(null);
          }}
        />
      ) : tab === 'inquiries' ? (
        <InquiryList
          inquiries={inquiries}
          onReview={(inq) => setReviewTarget({ kind: 'inquiry', item: inq })}
        />
      ) : (
        <AllBusinessList
          businesses={businesses}
          onReview={(biz) => setReviewTarget({ kind: 'business', item: biz })}
        />
      )}

      {rejectTarget && (
        <RejectBusinessModal
          business={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirmReject={rejectBusiness}
        />
      )}

      {reviewTarget && (
        <AdminBusinessReviewModal
          target={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSaveBusiness={saveBusinessDetails}
          onSaveInquiry={updateInquiry}
          onCreateBusinessFromInquiry={createBusinessForOwner}
        />
      )}
    </div>
  );
};

const PendingBusinessList: React.FC<{
  businesses: Business[];
  onApprove: (id: string) => void;
  onReview: (biz: Business) => void;
  onSelectReject: (biz: Business) => void;
}> = ({ businesses, onApprove, onReview, onSelectReject }) => {
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
        const smsAsk = `Assalomu alaykum! ${biz.name} bo‘yicha Dasturxon adminiman. MChJ yoki YaTT, faoliyatingiz va mahsulotlaringizni aniqlashtirsak bo‘ladimi?`;
        return (
          <div
            key={biz.id}
            className="p-5 rounded-2xl border space-y-3"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-base">
                  {biz.name}
                  {biz.legalForm ? ` (${biz.legalForm.toUpperCase()})` : ''}
                </div>
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
              {biz.activitySummary && <div>🧾 {biz.activitySummary}</div>}
              {biz.productsSummary && <div>🥖 {biz.productsSummary}</div>}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <a
                href={buildTelHref(biz.phone)}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
                style={{ borderColor: 'var(--dx-border)' }}
              >
                <PhoneCall className="w-3.5 h-3.5" /> Tel
              </a>
              <a
                href={buildSmsHref(biz.phone, smsAsk)}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
                style={{ borderColor: 'var(--dx-border)' }}
              >
                <MessageSquareText className="w-3.5 h-3.5" /> SMS
              </a>
              <button
                type="button"
                onClick={() => onReview(biz)}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                style={{ borderColor: 'var(--dx-secondary)', color: 'var(--dx-secondary)' }}
              >
                <Edit3 className="w-3.5 h-3.5" /> MChJ/YaTT &amp; Ma’lumot
              </button>
              <button
                type="button"
                onClick={() => onApprove(biz.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                <Check className="w-3.5 h-3.5" /> Tasdiqlash
              </button>
              <button
                type="button"
                onClick={() => onSelectReject(biz)}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
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

const InquiryList: React.FC<{
  inquiries: OwnerInquiry[];
  onReview: (inq: OwnerInquiry) => void;
}> = ({ inquiries, onReview }) => {
  if (inquiries.length === 0) {
    return (
      <div
        className="rounded-3xl p-10 text-center border"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="text-3xl mb-2">📩</div>
        <div className="font-bold text-sm">Hozircha murojaatlar yo‘q</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {inquiries.map((inq) => {
        const smsAsk = `Assalomu alaykum ${inq.ownerName}! Dasturxon adminiman. ${inq.legalForm.toUpperCase()} biznesingiz turi, manzili va mahsulotlari haqida gaplashsak bo‘ladimi?`;
        return (
          <div
            key={inq.id}
            className="p-5 rounded-2xl border space-y-2.5"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-base">
                  {inq.ownerName} · {inq.legalForm.toUpperCase()}
                </div>
                {inq.businessName && (
                  <div className="text-xs font-semibold" style={{ color: 'var(--dx-secondary)' }}>
                    {inq.businessName}
                  </div>
                )}
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg"
                style={{
                  backgroundColor:
                    inq.status === 'waiting'
                      ? 'var(--dx-primary-container)'
                      : 'var(--dx-tertiary-container)',
                }}
              >
                {inq.status === 'waiting'
                  ? 'Javob kutmoqda'
                  : inq.status === 'registered'
                    ? 'Tizimga kiritildi'
                    : 'Javob berildi'}
              </span>
            </div>
            <div className="text-xs space-y-1" style={{ color: 'var(--dx-muted)' }}>
              <div>📞 {inq.phone}</div>
              {inq.address && <div>📍 {inq.address}</div>}
              <div>🧾 Faoliyat: {inq.activitySummary}</div>
              <div>🥖 Mahsulotlar: {inq.productsSummary}</div>
              {inq.adminReply && (
                <div style={{ color: 'var(--dx-tertiary)' }}>💬 Admin javobi: {inq.adminReply}</div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <a
                href={buildTelHref(inq.phone)}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
                style={{ borderColor: 'var(--dx-border)' }}
              >
                <PhoneCall className="w-3.5 h-3.5" /> Tel
              </a>
              <a
                href={buildSmsHref(inq.phone, smsAsk)}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
                style={{ borderColor: 'var(--dx-border)' }}
              >
                <MessageSquareText className="w-3.5 h-3.5" /> SMS
              </a>
              <button
                type="button"
                onClick={() => onReview(inq)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                <Edit3 className="w-3.5 h-3.5" /> Ma’lumot kiritish &amp; Javob
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AllBusinessList: React.FC<{ businesses: Business[]; onReview: (biz: Business) => void }> = ({
  businesses,
  onReview,
}) => (
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
              <div className="font-bold text-sm truncate">
                {biz.name}
                {biz.legalForm ? ` (${biz.legalForm.toUpperCase()})` : ''}
              </div>
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
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onReview(biz)}
              aria-label="Tahrirlash"
              className="p-2 rounded-xl border cursor-pointer"
              style={{ borderColor: 'var(--dx-border)' }}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl"
              style={{ backgroundColor: badge.bg, color: badge.fg }}
            >
              {badge.label}
            </span>
          </div>
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
    className="p-4 rounded-2xl border"
    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
  >
    <div className="text-xs font-semibold" style={{ color: 'var(--dx-muted)' }}>
      {title}
    </div>
    <div className="font-display text-xl font-extrabold mt-1" style={color ? { color } : undefined}>
      {value}
    </div>
  </div>
);
