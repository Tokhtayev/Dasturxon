import type { CustomerOrder, Expense, Product } from '../types/dasturxon';

/**
 * Exact port of MoneyFormatter.kt -> "5 000 so'm"
 */
export function formatSoM(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${formatted} so'm`;
}

export function isDiscountActive(product: Product, now = Date.now()): boolean {
  return (
    product.discountPercent > 0 &&
    (product.discountEndsAt === null || product.discountEndsAt > now)
  );
}

export function getEffectivePrice(product: Product, now = Date.now()): number {
  if (!isDiscountActive(product, now)) return product.price;
  return Math.round(product.price - (product.price * product.discountPercent) / 100);
}

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

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all';

/**
 * Computes Asia/Tashkent (UTC+5) start-of-day / period bounds and runs
 * exact AnalyticsCalculator.kt financial formulas:
 * - Revenue = completed & paid orders
 * - COGS = sum(qty * unitCost or product costPrice)
 * - Gross Profit = Revenue - COGS
 * - Net Profit = Gross Profit - Expenses
 */
export function getPeriodStart(period: AnalyticsPeriod, nowMs = Date.now()): number {
  if (period === 'all') return 0;
  // Asia/Tashkent is UTC+5 with no DST
  const tzOffsetMs = 5 * 60 * 60 * 1000;
  const tashkentDate = new Date(nowMs + tzOffsetMs);
  if (period === 'today') {
    const startUtc = Date.UTC(
      tashkentDate.getUTCFullYear(),
      tashkentDate.getUTCMonth(),
      tashkentDate.getUTCDate()
    );
    return startUtc - tzOffsetMs;
  }
  if (period === '7d') {
    return nowMs - 7 * 24 * 60 * 60 * 1000;
  }
  return nowMs - 30 * 24 * 60 * 60 * 1000;
}

export function calculateAnalytics(
  orders: CustomerOrder[],
  expenses: Expense[],
  products: Product[],
  period: AnalyticsPeriod,
  nowMs = Date.now()
): AnalyticsReport {
  const start = getPeriodStart(period, nowMs);

  const periodOrders = orders.filter((order) => {
    const ts = order.paidAt ?? order.createdAt ?? order.pickupTime;
    return ts >= start && ts <= nowMs + 86400000;
  });

  const periodExpenses = expenses.filter(
    (expense) => expense.createdAt >= start && expense.createdAt <= nowMs + 86400000
  );

  const totalOrders = periodOrders.length;
  const completedList = periodOrders.filter(
    (o) => o.status === 'completed' && o.paymentStatus === 'paid'
  );
  const cancelledList = periodOrders.filter(
    (o) => o.status === 'cancelled' || o.status === 'rejected'
  );
  const inProgressList = periodOrders.filter((o) =>
    ['pending', 'accepted', 'ready'].includes(o.status)
  );

  const completedCount = completedList.length;
  const cancelledCount = cancelledList.length;
  const inProgressCount = inProgressList.length;

  const totalRevenue = completedList.reduce((acc, o) => acc + o.totalPrice, 0);
  const averageTicket = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;
  const completionRate = totalOrders > 0 ? completedCount / totalOrders : 0;
  const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);

  const productCostMap = new Map<string, number>();
  const productPriceMap = new Map<string, number>();
  products.forEach((p) => {
    productCostMap.set(p.id, p.costPrice);
    productPriceMap.set(p.id, p.price);
  });

  const groups = new Map<string, CustomerOrder[]>();
  completedList.forEach((order) => {
    const key = order.productId || order.productName;
    const list = groups.get(key) ?? [];
    list.push(order);
    groups.set(key, list);
  });

  const productStats: ProductAnalytics[] = Array.from(groups.entries()).map(([key, pOrders]) => {
    const pName = pOrders[0]?.productName ?? key;
    const pId = pOrders[0]?.productId ?? key;
    const qty = pOrders.reduce((sum, o) => sum + o.quantity, 0);
    const rev = pOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const snapshotUnitCost = pOrders[0]?.items?.[0]?.unitCost;
    const costPerUnit = snapshotUnitCost ?? productCostMap.get(pId) ?? 0;
    const sellingPerUnit = productPriceMap.get(pId) ?? (qty > 0 ? Math.round(rev / qty) : 0);
    const pCogs = costPerUnit * qty;
    const pProfit = rev - pCogs;

    return {
      productId: pId,
      productName: pName,
      quantitySold: qty,
      revenue: rev,
      cogs: pCogs,
      profit: pProfit,
      costPrice: costPerUnit,
      sellingPrice: sellingPerUnit,
    };
  });

  const cogs = productStats.reduce((sum, s) => sum + s.cogs, 0);
  const grossProfit = totalRevenue - cogs;
  const netProfit = grossProfit - totalExpenses;

  const bestSellers = [...productStats].sort((a, b) => b.quantitySold - a.quantitySold);
  const mostProfitable = productStats
    .filter((s) => s.profit > 0)
    .sort((a, b) => b.profit - a.profit);
  const lossMakers = productStats.filter(
    (s) => s.profit < 0 || (s.costPrice > s.sellingPrice && s.costPrice > 0)
  );

  const trendPoints =
    completedList.length > 0
      ? [...completedList]
          .sort((a, b) => (a.paidAt ?? a.createdAt) - (b.paidAt ?? b.createdAt))
          .map((o) => Math.max(1, Math.round(o.totalPrice / 1000)))
      : [0, 0];

  return {
    totalRevenue,
    totalOrders,
    completedOrders: completedCount,
    cancelledOrders: cancelledCount,
    inProgressOrders: inProgressCount,
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
