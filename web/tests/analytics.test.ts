import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAnalytics, formatSoM, getEffectivePrice } from '../src/utils/analytics.ts';
import { INITIAL_EXPENSES, INITIAL_ORDERS, INITIAL_PRODUCTS } from '../src/data/demoData.ts';

test('formatSoM matches MoneyFormatter.kt spacing', () => {
  assert.equal(formatSoM(5000), "5 000 so'm");
  assert.equal(formatSoM(1250000), "1 250 000 so'm");
  assert.equal(formatSoM(-3500), "-3 500 so'm");
});

test('getEffectivePrice applies active discount accurately', () => {
  const patir = INITIAL_PRODUCTS.find((p) => p.id === 'demo_prod_gijduvon_patir');
  assert.ok(patir);
  assert.equal(getEffectivePrice(patir), 12600);
});

test('calculateAnalytics requires completed + paid orders and deducts COGS + expenses', () => {
  const report = calculateAnalytics(INITIAL_ORDERS, INITIAL_EXPENSES, INITIAL_PRODUCTS, '30d');
  // Completed & paid in demo orders: 150000 + 360000 + 252000 = 762000
  assert.equal(report.totalRevenue, 762000);
  // COGS: (30*2800) + (45*4800) + (20*7500) = 84000 + 216000 + 150000 = 450000
  assert.equal(report.cogs, 450000);
  assert.equal(report.grossProfit, 312000);
  // Expenses: 210000 + 85000 = 295000
  assert.equal(report.totalExpenses, 295000);
  assert.equal(report.netProfit, 17000);
  assert.equal(report.completedOrders, 3);
  assert.equal(report.inProgressOrders, 2);
  assert.equal(report.cancelledOrders, 1);
});
