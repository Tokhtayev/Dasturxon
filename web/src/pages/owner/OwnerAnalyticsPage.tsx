import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import { OrderStatusDonutChart, RevenueLineChart } from '../../components/Charts';
import { formatSoM } from '../../services/analytics';
import type { OwnerContextType } from './OwnerLayout';

export const OwnerAnalyticsPage: React.FC = () => {
  const { report, expenses, analyticsPeriod, setAnalyticsPeriod, addExpense, deleteExpense } =
    useOutletContext<OwnerContextType>();

  const [expOpen, setExpOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Xomashyo');

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!title.trim() || !Number.isFinite(num) || num <= 0) return;
    await addExpense({ title, amount: num, category });
    setTitle('');
    setAmount('');
    setExpOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold">Biznes Analitikasi</h1>
        <div className="flex gap-1.5">
          {(
            [
              ['today', 'Bugun'],
              ['week', 'Bu hafta'],
              ['month', 'Bu oy'],
              ['all', 'Barchasi'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAnalyticsPeriod(key)}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
              style={{
                backgroundColor: analyticsPeriod === key ? 'var(--dx-primary)' : 'var(--dx-surface)',
                color: analyticsPeriod === key ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                borderColor: 'var(--dx-border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        <Kpi title="Daromad (completed + paid)" value={formatSoM(report.totalRevenue)} color="var(--dx-primary)" />
        <Kpi title="Xarajatlar" value={formatSoM(report.totalExpenses)} />
        <Kpi title="Yalpi foyda (Rev − COGS)" value={formatSoM(report.grossProfit)} color="var(--dx-secondary)" />
        <Kpi
          title="Sof foyda (Gross − Exp)"
          value={formatSoM(report.netProfit)}
          color={report.netProfit >= 0 ? 'var(--dx-tertiary)' : 'var(--dx-error)'}
        />
        <Kpi title="O‘rtacha chek" value={formatSoM(report.averageTicket)} />
        <Kpi title="Bajarilish darajasi" value={`${Math.round(report.completionRate * 100)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div
          className="lg:col-span-7 p-5 rounded-2xl border space-y-2"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="font-bold text-sm">Tushum dinamikasi (ming so‘m)</div>
          <RevenueLineChart data={report.trendPoints} />
        </div>
        <div
          className="lg:col-span-5 p-5 rounded-2xl border space-y-2"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="font-bold text-sm">Buyurtmalar holati</div>
          <OrderStatusDonutChart
            completed={report.completedOrders}
            inProgress={report.inProgressOrders}
            cancelled={report.cancelledOrders}
          />
        </div>
      </div>

      {/* Expenses Section */}
      <div
        className="p-5 rounded-2xl border space-y-3.5"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Xarajatlar ({expenses.length})</h2>
          <button
            type="button"
            onClick={() => setExpOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            style={{
              backgroundColor: 'var(--dx-primary-container)',
              color: 'var(--dx-on-primary-container)',
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Xarajat qo‘shish
          </button>
        </div>

        {expenses.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
            Hozircha xarajatlar kiritilmagan.
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs"
                style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
              >
                <div>
                  <div className="font-bold">{exp.title}</div>
                  <div style={{ color: 'var(--dx-muted)' }}>{exp.category}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold">{formatSoM(exp.amount)}</span>
                  <button
                    type="button"
                    onClick={() => void deleteExpense(exp.id)}
                    className="p-1 cursor-pointer"
                    style={{ color: 'var(--dx-error)' }}
                    aria-label="Xarajatni o'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {expOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddExpense}
            className="w-full max-w-sm rounded-3xl border p-6 space-y-3.5"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Xarajat kiritish</h2>
              <button type="button" onClick={() => setExpOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Xarajat nomi (masalan: Bug'doy uni)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Summa (so'm)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            >
              <option value="Xomashyo">Xomashyo</option>
              <option value="Kommunal">Kommunal</option>
              <option value="Ish haqi">Ish haqi</option>
              <option value="Boshqa">Boshqa</option>
            </select>
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

const Kpi: React.FC<{ title: string; value: string; color?: string }> = ({
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
    <div className="text-lg font-extrabold" style={{ color: color ?? 'var(--dx-text)' }}>
      {value}
    </div>
  </div>
);
