import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import { MAX_EXPENSE_TITLE_LENGTH, MAX_TYPE_NOTE_LENGTH } from '../services/constants';
import { sanitizeUserText, validateExpenseInput } from '../services/validators';
import type { Expense } from '../types/domain';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return Date.now();
}

export function mapExpenseDoc(id: string, data: Record<string, unknown>): Expense {
  return {
    id,
    businessId: typeof data.businessId === 'string' ? data.businessId : '',
    title: typeof data.title === 'string' ? data.title : '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    category: typeof data.category === 'string' ? data.category : 'Boshqa',
    createdAtMs: toMillis(data.createdAt),
  };
}

export const expenseRepository = {
  observeForBusiness(
    businessId: string,
    onData: (expenses: Expense[]) => void,
    onError: (err: Error) => void
  ): Unsubscribe {
    const db = getFirebaseDb();
    const q = query(collection(db, 'expenses'), where('businessId', '==', businessId));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => mapExpenseDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        onData(items);
      },
      (err) => onError(new Error(err.message))
    );
  },

  async create(params: {
    businessId: string;
    title: string;
    amount: number;
    category: string;
  }): Promise<string> {
    const check = validateExpenseInput(params);
    if (!check.valid) throw new Error(check.error);

    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, 'expenses'), {
      businessId: params.businessId,
      title: sanitizeUserText(params.title, MAX_EXPENSE_TITLE_LENGTH),
      amount: Math.round(params.amount),
      category: sanitizeUserText(params.category, MAX_TYPE_NOTE_LENGTH),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async delete(expenseId: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'expenses', expenseId));
  },
};
