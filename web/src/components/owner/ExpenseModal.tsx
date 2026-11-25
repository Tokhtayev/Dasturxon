import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import { validateExpenseInput } from '../../services/validators';

interface ExpenseModalProps {
  onClose: () => void;
  onAdd: (params: { title: string; amount: number; category: string }) => Promise<void>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = Number(amount);
    const check = validateExpenseInput({ title, amount: num, category });
    if (!check.valid) {
      setError(check.error ?? 'Xarajat nomi va musbat summani kiriting.');
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({ title, amount: num, category });
      onClose();
    } catch (err) {
      setError(getReadableErrorMessage(err, "Xarajatni saqlab bo'lmadi."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleAddExpense}
        className="w-full max-w-sm rounded-3xl border p-6 space-y-3.5"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Xarajat kiritish</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
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
          {EXPENSE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {error && (
          <div
            className="p-2.5 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: 'var(--dx-error-container)',
              color: 'var(--dx-on-error-container)',
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          {submitting ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
};
