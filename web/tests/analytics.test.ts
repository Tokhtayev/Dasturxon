import { describe, expect, it } from 'vitest';
import {
  calculateAnalytics,
  formatSoM,
  getEffectivePrice,
  getPeriodBounds,
} from '../src/services/analytics';
import type { CustomerOrder, Expense, Product } from '../src/types/domain';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    businessId: 'b1',
    businessName: 'Baraka',
    businessType: 'bakery',
    businessAddress: 'Yunusobod',
    businessPhone: '+998901234567',
    name: 'Tandir non',
    description: '',
    price: 5000,
    costPrice: 3000,
    published: true,
    status: 'available',
    stock: 10,
    discountPercent: 0,
    discountEndsAtMs: null,
    imageUrl: '',
    updatedAtMs: 0,
    ...overrides,
  };
}

function makeOrder(overrides: Partial<CustomerOrder> = {}): CustomerOrder {
  const now = Date.UTC(2026, 10, 25, 8, 0, 0);
  return {
    id: 'o1',
    customerId: 'c1',
    customerName: 'Aziz',
    customerPhone: '',
    businessId: 'b1',
    businessName: 'Baraka',
    productId: 'p1',
    productName: 'Tandir non',
    quantity: 1,
    unitPrice: 5000,
    totalPrice: 5000,
    status: 'completed',
    paymentStatus: 'paid',
    fulfillmentType: 'pickup',
    deliveryAddress: '',
    pickupTimeMs: now,
    createdAtMs: now,
    updatedAtMs: now,
    paidAtMs: now,
    ...overrides,
  };
}

describe('analytics & profit calculation', () => {
  it('getEffectivePrice applies math.floor parity with firestore.rules and checks expiration', () => {
    const now = Date.UTC(2026, 10, 25, 8, 0, 0);
    // 5555 - floor(5555 * 15 / 100) = 5555 - 833 = 4722
    expect(getEffectivePrice(makeProduct({ price: 5555, discountPercent: 15 }), now)).toBe(4722);
    expect(
      getEffectivePrice(
        makeProduct({ price: 5555, discountPercent: 15, discountEndsAtMs: now - 1 }),
        now
      )
    ).toBe(5555);
  });

  it('formatSoM formats zero, positive, and negative currency amounts cleanly', () => {
    expect(formatSoM(0)).toBe("0 so'm");
    expect(formatSoM(15000)).toBe("15 000 so'm");
    expect(formatSoM(-3500)).toBe("-3 500 so'm");
  });

  it('getPeriodBounds computes Monday week start and month start in Asia/Tashkent', () => {
    const wedTashkent = Date.UTC(2026, 10, 25, 10, 0, 0);
    // Monday 2026-11-23 00:00:00 UTC+5 == 2026-11-22 19:00:00 UTC
    expect(getPeriodBounds('week', wedTashkent).start).toBe(Date.UTC(2026, 10, 22, 19, 0, 0));
    // 2026-11-01 00:00:00 UTC+5 == 2026-10-31 19:00:00 UTC
    expect(getPeriodBounds('month', wedTashkent).start).toBe(Date.UTC(2026, 9, 31, 19, 0, 0));
  });

  it('calculateAnalytics includes only completed+paid orders and separates COGS and expenses', () => {
    const now = Date.UTC(2026, 10, 25, 8, 0, 0);
    const products = [makeProduct({ price: 5000, costPrice: 3000 })];
    const orders = [
      makeOrder({
        id: 'o1',
        quantity: 10,
        totalPrice: 50000,
        status: 'completed',
        paymentStatus: 'paid',
      }),
      makeOrder({
        id: 'o2',
        quantity: 5,
        totalPrice: 25000,
        status: 'completed',
        paymentStatus: 'unpaid',
      }),
      makeOrder({
        id: 'o3',
        quantity: 2,
        totalPrice: 10000,
        status: 'pending',
        paymentStatus: 'unpaid',
      }),
      makeOrder({
        id: 'o4',
        quantity: 1,
        totalPrice: 5000,
        status: 'cancelled',
        paymentStatus: 'unpaid',
      }),
    ];
    const expenses: Expense[] = [
      {
        id: 'e1',
        businessId: 'b1',
        title: 'Un',
        amount: 8000,
        category: 'Xomashyo',
        createdAtMs: now,
      },
    ];

    const report = calculateAnalytics(orders, expenses, products, 'today', now);
    expect(report.totalRevenue).toBe(50000);
    expect(report.cogs).toBe(30000);
    expect(report.grossProfit).toBe(20000);
    expect(report.totalExpenses).toBe(8000);
    expect(report.netProfit).toBe(12000);
    expect(report.completedOrders).toBe(1);
    expect(report.inProgressOrders).toBe(1);
    expect(report.cancelledOrders).toBe(1);
  });

  it('calculateAnalytics handles empty inputs safely without division by zero', () => {
    const now = Date.UTC(2026, 10, 25, 8, 0, 0);
    const empty = calculateAnalytics([], [], [], 'today', now);
    expect(empty.totalRevenue).toBe(0);
    expect(empty.averageTicket).toBe(0);
    expect(empty.completionRate).toBe(0);
    expect(empty.netProfit).toBe(0);
  });

  it('calculateAnalytics uses historical itemCostOverrides and flags lossMakers', () => {
    const now = Date.UTC(2026, 10, 25, 8, 0, 0);
    const products = [makeProduct({ id: 'p-loss', name: 'Somsa', price: 4000, costPrice: 2000 })];
    const orders = [
      makeOrder({
        id: 'o-loss',
        productId: 'p-loss',
        productName: 'Somsa',
        quantity: 2,
        unitPrice: 4000,
        totalPrice: 8000,
      }),
    ];
    const overrides = new Map<string, number>([['o-loss', 5500]]);

    const report = calculateAnalytics(orders, [], products, 'today', now, overrides);
    expect(report.cogs).toBe(11000);
    expect(report.grossProfit).toBe(-3000);
    expect(report.lossMakers).toHaveLength(1);
  });
});
