import React, { useState } from 'react';
import { Check, ShieldCheck, Store, X } from 'lucide-react';
import type { Business, BusinessStatus } from '../types/dasturxon';
import { BUSINESS_TYPES } from '../data/demoData';
import { DxLogo } from './DxLogo';

interface AdminWorkspaceProps {
  businesses: Business[];
  onSetBusinessStatus: (id: string, status: BusinessStatus, rejectionReason?: string) => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  businesses,
  onSetBusinessStatus,
}) => {
  const [tab, setTab] = useState<'overview' | 'approvals' | 'all'>('approvals');
  const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pending = businesses.filter((b) => b.status === 'pending');
  const approved = businesses.filter((b) => b.status === 'approved');
  const rejected = businesses.filter((b) => b.status === 'rejected');

  return (
    <div
      className="rounded-3xl border overflow-hidden shadow-xl flex flex-col"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    >
      <div
        className="px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <DxLogo size={32} />
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold"
          style={{
            backgroundColor: 'var(--dx-tertiary-container)',
            color: 'var(--dx-on-tertiary-container)',
          }}
        >
          <ShieldCheck className="w-4 h-4" /> Tizim Administratori
        </span>
      </div>

      <div className="p-4 sm:p-6 min-h-[480px] space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
          {(
            [
              ['overview', 'Umumiy'],
              ['approvals', `Tasdiqlar (${pending.length})`],
              ['all', `Bizneslar (${businesses.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              style={{
                backgroundColor: tab === id ? 'var(--dx-primary)' : 'var(--dx-surface)',
                color: tab === id ? 'var(--dx-on-primary)' : 'var(--dx-text)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="text-[11px] font-bold" style={{ color: 'var(--dx-muted)' }}>Tasdiq kutmoqda</div>
            <div className="text-xl font-extrabold mt-1" style={{ color: 'var(--dx-primary)' }}>{pending.length} ta</div>
          </div>
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="text-[11px] font-bold" style={{ color: 'var(--dx-muted)' }}>Tasdiqlangan</div>
            <div className="text-xl font-extrabold mt-1" style={{ color: 'var(--dx-tertiary)' }}>{approved.length} ta</div>
          </div>
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="text-[11px] font-bold" style={{ color: 'var(--dx-muted)' }}>Rad etilgan</div>
            <div className="text-xl font-extrabold mt-1" style={{ color: '#BA1A1A' }}>{rejected.length} ta</div>
          </div>
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="text-[11px] font-bold" style={{ color: 'var(--dx-muted)' }}>Jami bizneslar</div>
            <div className="text-xl font-extrabold mt-1">{businesses.length} ta</div>
          </div>
        </div>

        {tab === 'approvals' && (
          <div className="space-y-3">
            <h4 className="font-bold text-base">Tasdiq kutayotgan bizneslar ({pending.length})</h4>
            {pending.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="text-2xl mb-1">✅</div>
                <div className="font-bold text-sm">Hozircha kutilayotgan arizalar yo‘q</div>
                <p className="text-xs mt-1" style={{ color: 'var(--dx-muted)' }}>
                  Tasdiqlangan biznes endi Xaridor rejimida ham ko‘rinadi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((biz) => {
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
                          <div className="text-xs mt-0.5" style={{ color: 'var(--dx-secondary)' }}>
                            Turi: {meta?.icon} {meta?.labelUz}
                          </div>
                        </div>
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
                        >
                          Kutilmoqda
                        </span>
                      </div>
                      <div className="text-xs space-y-1" style={{ color: 'var(--dx-muted)' }}>
                        <div>📍 Manzil: {biz.address}</div>
                        <div>📞 Telefon: {biz.phone}</div>
                        {biz.typeNote && <div>📝 Izoh: {biz.typeNote}</div>}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onSetBusinessStatus(biz.id, 'approved')}
                          className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                        >
                          <Check className="w-3.5 h-3.5" /> Tasdiqlash
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(biz);
                            setRejectReason('');
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
            )}
          </div>
        )}

        {(tab === 'overview' || tab === 'all') && (
          <div className="space-y-3">
            <h4 className="font-bold text-base">Barcha bizneslar ({businesses.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {businesses.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border flex items-center justify-between gap-3"
                  style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
                    >
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{b.name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--dx-muted)' }}>{b.address}</div>
                      {b.rejectionReason && (
                        <div className="text-[11px] mt-0.5 font-semibold" style={{ color: 'var(--dx-error)' }}>
                          Sabab: {b.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                    style={{
                      backgroundColor:
                        b.status === 'approved'
                          ? 'var(--dx-tertiary-container)'
                          : b.status === 'rejected'
                            ? 'var(--dx-error-container)'
                            : 'var(--dx-primary-container)',
                      color:
                        b.status === 'approved'
                          ? 'var(--dx-on-tertiary-container)'
                          : b.status === 'rejected'
                            ? 'var(--dx-on-error-container)'
                            : 'var(--dx-on-primary-container)',
                    }}
                  >
                    {b.status === 'approved'
                      ? 'Tasdiqlangan'
                      : b.status === 'rejected'
                        ? 'Rad etilgan'
                        : 'Kutilmoqda'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Reason Modal (min 3 chars enforced) */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border p-6 space-y-4" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-bold">Biznesni rad etish</h4>
              <button type="button" onClick={() => setRejectTarget(null)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>{rejectTarget.name}</div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Rad etish sababini kiriting (kamida 3 belgi)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
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
                type="button"
                disabled={rejectReason.trim().length < 3}
                onClick={() => {
                  onSetBusinessStatus(rejectTarget.id, 'rejected', rejectReason.trim());
                  setRejectTarget(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-error)', color: '#fff' }}
              >
                Rad etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
