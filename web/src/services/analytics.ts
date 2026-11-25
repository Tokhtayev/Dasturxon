import type { CustomerOrder, Expense, Product } from '../types/domain';
import {
  DAYS_IN_WEEK,
  IN_PROGRESS_ORDER_STATUSES,
  MAX_DISCOUNT_PERCENT,
  MILLIS_TO_THOUSANDS,
  MS_PER_DAY,
  PERCENT_DIVISOR,
  TASHKENT_UTC_OFFSET_MS,
} from './constants.ts';

export function formatSoM(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

export function isDiscountActive(product: Product, nowMs = Date.now()): boolean {
  return (
    product.discountPercent > 0 &&
    product.discountPercent <= MAX_DISCOUNT_PERCENT &&
    (product.discountEndsAtMs === null || product.discountEndsAtMs > nowMs)
  );
}

/**
 * Matches firestore.rules `expectedLineItemPrice`:
 * prod.price - int(math.floor((prod.price * prod.discountPercent) / 100.0))
 */
export function getEffectivePrice(product: Product, nowMs = Date.now()): number {
  if (!isDiscountActive(product, nowMs)) return product.price;
  return product.price - Math.floor((product.price * product.discountPercent) / PERCENT_DIVISOR);
}

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'all';

export interface ProductAnalytics {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cogs: number;
  profit: number;
  costPrice: number;
  sellingPrice: number;
}

export interface AnalyticsReport {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  inProgressOrders: number;
  averageTicket: number;
  completionRate: number;
  totalExpenses: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  productStats: ProductAnalytics[];
  bestSellers: ProductAnalytics[];
  mostProfitable: ProductAnalytics[];
  lossMakers: ProductAnalytics[];
  trendPoints: number[];
}

export function getPeriodBounds(
  period: AnalyticsPeriod,
  nowMs = Date.now()
): { start: number; end: number } {
  if (period === 'all') return { start: 0, end: nowMs + MS_PER_DAY };

  const tashkentDate = new Date(nowMs + TASHKENT_UTC_OFFSET_MS);
  const y = tashkentDate.getUTCFullYear();
  const m = tashkentDate.getUTCMonth();
  const d = tashkentDate.getUTCDate();

  if (period === 'today') {
    const start = Date.UTC(y, m, d) - TASHKENT_UTC_OFFSET_MS;
    return { start, end: nowMs + MS_PER_DAY };
  }

  if (period === 'week') {
    // Monday start in Asia/Tashkent
    const dayOfWeek = tashkentDate.getUTCDay(); // 0=Sun..6=Sat
    const diffToMonday = dayOfWeek === 0 ? DAYS_IN_WEEK - 1 : dayOfWeek - 1;
    const start = Date.UTC(y, m, d - diffToMonday) - TASHKENT_UTC_OFFSET_MS;
    return { start, end: nowMs + MS_PER_DAY };
  }

  // Month start (1st day 00:00 Asia/Tashkent)
  const start = Date.UTC(y, m, 1) - TASHKENT_UTC_OFFSET_MS;
  return { start, end: nowMs + MS_PER_DAY };
}

function buildProductAnalytics(
  completedList: CustomerOrder[],
  products: Product[],
  itemCostOverrides?: Map<string, number>
): ProductAnalytics[] {
  const productCostMap = new Map<string, number>();
  const productPriceMap = new Map<string, number>();
  products.forEach((p) => {
    productCostMap.set(p.id, p.costPrice);
    productPriceMap.set(p.id, p.price);
  });

  const groups = new Map<string, CustomerOrder[]>();
  completedList.forEach((order) => {
    const key = order.productId || order.productName;
    const arr = groups.get(key) ?? [];
    arr.push(order);
    groups.set(key, arr);
  });

  return Array.from(groups.entries()).map(([key, pOrders]) => {
    const pName = pOrders[0]?.productName ?? key;
    const pId = pOrders[0]?.productId ?? key;
    const qty = pOrders.reduce((s, o) => s + o.quantity, 0);
    const rev = pOrders.reduce((s, o) => s + o.totalPrice, 0);
    const cogs = pOrders.reduce((s, o) => {
      const unitCost = itemCostOverrides?.get(o.id) ?? productCostMap.get(pId) ?? 0;
      return s + unitCost * o.quantity;
    }, 0);
    const costPerUnit = qty > 0 ? Math.round(cogs / qty) : (productCostMap.get(pId) ?? 0);
    const sellingPerUnit = productPriceMap.get(pId) ?? (qty > 0 ? Math.round(rev / qty) : 0);

    return {
      productId: pId,
      productName: pName,
      quantitySold: qty,
      revenue: rev,
      cogs,
      profit: rev - cogs,
      costPrice: costPerUnit,
      sellingPrice: sellingPerUnit,
    };
  });
}

export function calculateAnalytics(
  orders: CustomerOrder[],
  expenses: Expense[],
  products: Product[],
  period: AnalyticsPeriod,
  nowMs = Date.now(),
  itemCostOverrides?: Map<string, number>
): AnalyticsReport {
  const { start, end } = getPeriodBounds(period, nowMs);

  const periodOrders = orders.filter((order) => {
    const ts = order.paidAtMs ?? order.createdAtMs ?? order.pickupTimeMs;
    return ts >= start && ts <= end;
  });

  const periodExpenses = expenses.filter(
    (expense) => expense.createdAtMs >= start && expense.createdAtMs <= end
  );

  const totalOrders = periodOrders.length;
  // Revenue strictly requires completed AND paid orders
  const completedList = periodOrders.filter(
    (o) => o.status === 'completed' && o.paymentStatus === 'paid'
  );
  const cancelledList = periodOrders.filter(
    (o) => o.status === 'cancelled' || o.status === 'rejected'
  );
  const inProgressList = periodOrders.filter((o) => IN_PROGRESS_ORDER_STATUSES.includes(o.status));

  const completedCount = completedList.length;
  const totalRevenue = completedList.reduce((acc, o) => acc + o.totalPrice, 0);
  const averageTicket = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
  const completionRate = totalOrders > 0 ? completedCount / totalOrders : 0;
  const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);

  const productStats = buildProductAnalytics(completedList, products, itemCostOverrides);
  const cogs = productStats.reduce((s, x) => s + x.cogs, 0);
  const grossProfit = totalRevenue - cogs;
  const netProfit = grossProfit - totalExpenses;

  const bestSellers = [...productStats].sort((a, b) => b.quantitySold - a.quantitySold);
  const mostProfitable = productStats
    .filter((x) => x.profit > 0)
    .sort((a, b) => b.profit - a.profit);
  const lossMakers = productStats.filter(
    (x) => x.profit < 0 || (x.costPrice > x.sellingPrice && x.costPrice > 0)
  );

  const trendPoints =
    completedList.length > 0
      ? [...completedList]
          .sort((a, b) => (a.paidAtMs ?? a.createdAtMs) - (b.paidAtMs ?? b.createdAtMs))
          .map((o) => Math.max(1, Math.round(o.totalPrice / MILLIS_TO_THOUSANDS)))
      : [0, 0];

  return {
    totalRevenue,
    totalOrders,
    completedOrders: completedCount,
    cancelledOrders: cancelledList.length,
    inProgressOrders: inProgressList.length,
    averageTicket,
    completionRate,
    totalExpenses,
    cogs,
    grossProfit,
    netProfit,
    productStats,
    bestSellers,
    mostProfitable,
    lossMakers,
    trendPoints,
  };
}
