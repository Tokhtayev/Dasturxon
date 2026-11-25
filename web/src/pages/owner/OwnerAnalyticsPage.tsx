import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { OrderStatusDonutChart, RevenueLineChart } from '../../components/Charts';
import { ExpenseModal } from '../../components/owner/ExpenseModal';
import { formatSoM } from '../../services/analytics';
import { PERCENT_DIVISOR } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import type { Expense } from '../../types/domain';
import type { OwnerContextType } from './OwnerLayout';

const PERIOD_TABS = [
  ['today', 'Bugun'],
  ['week', 'Bu hafta'],
  ['month', 'Bu oy'],
  ['all', 'Barchasi'],
] as const;

export const OwnerAnalyticsPage: React.FC = () => {
  const { report, expenses, analyticsPeriod, setAnalyticsPeriod, addExpense, deleteExpense } =
    useOutletContext<OwnerContextType>();
  const [expOpen, setExpOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDeleteExpense = async (expenseId: string) => {
    setActionError(null);
    try {
      await deleteExpense(expenseId);
    } catch (err) {
      setActionError(getReadableErrorMessage(err, "Xarajatni o'chirib bo'lmadi."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold">Biznes Analitikasi</h1>
        <div className="flex gap-1.5">
          {PERIOD_TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAnalyticsPeriod(key)}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
              style={{
                backgroundColor:
                  analyticsPeriod === key ? 'var(--dx-primary)' : 'var(--dx-surface)',
                color: analyticsPeriod === key ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                borderColor: 'var(--dx-border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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

      <AnalyticsKpiGrid
        revenue={report.totalRevenue}
        expenses={report.totalExpenses}
        gross={report.grossProfit}
        net={report.netProfit}
        avgTicket={report.averageTicket}
        completionRate={report.completionRate}
      />

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

      <ExpensesSection
        expenses={expenses}
        onOpenAdd={() => setExpOpen(true)}
        onDelete={(id) => void handleDeleteExpense(id)}
      />

      {expOpen && <ExpenseModal onClose={() => setExpOpen(false)} onAdd={addExpense} />}
    </div>
  );
};

const AnalyticsKpiGrid: React.FC<{
  revenue: number;
  expenses: number;
  gross: number;
  net: number;
  avgTicket: number;
  completionRate: number;
}> = ({ revenue, expenses, gross, net, avgTicket, completionRate }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
    <Kpi title="Daromad (completed + paid)" value={formatSoM(revenue)} color="var(--dx-primary)" />
    <Kpi title="Xarajatlar" value={formatSoM(expenses)} />
    <Kpi title="Yalpi foyda (Rev − COGS)" value={formatSoM(gross)} color="var(--dx-secondary)" />
    <Kpi
      title="Sof foyda (Gross − Exp)"
      value={formatSoM(net)}
      color={net >= 0 ? 'var(--dx-tertiary)' : 'var(--dx-error)'}
    />
    <Kpi title="O‘rtacha chek" value={formatSoM(avgTicket)} />
    <Kpi title="Bajarilish darajasi" value={`${Math.round(completionRate * PERCENT_DIVISOR)}%`} />
  </div>
);

const ExpensesSection: React.FC<{
  expenses: Expense[];
  onOpenAdd: () => void;
  onDelete: (id: string) => void;
}> = ({ expenses, onOpenAdd, onDelete }) => (
  <div
    className="p-5 rounded-2xl border space-y-3.5"
    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
  >
    <div className="flex items-center justify-between">
      <h2 className="font-bold text-base">Xarajatlar ({expenses.length})</h2>
      <button
        type="button"
        onClick={onOpenAdd}
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
                onClick={() => onDelete(exp.id)}
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
);

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
