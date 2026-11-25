import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAnalytics,
  formatSoM,
  getEffectivePrice,
  getPeriodBounds,
} from '../src/services/analytics.ts';
import {
  isStrongPassword,
  isValidEmail,
  isValidNickname,
  normalizeNickname,
  validateBusinessForm,
  validateProductForm,
  validateSignUpForm,
} from '../src/services/validators.ts';
import type { CustomerOrder, Expense, Product } from '../src/types/domain.ts';

test('validators validate email, strong password, and nickname rules', () => {
  assert.equal(isValidEmail('ali@dasturxon.uz'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isStrongPassword('Pass1234'), true);
  assert.equal(isStrongPassword('12345678'), false);
  assert.equal(normalizeNickname('  Ali_Bek '), 'ali_bek');
  assert.equal(isValidNickname('ali_bek99'), true);
  assert.equal(isValidNickname('ab'), false);
  assert.equal(
    validateSignUpForm({
      fullName: 'Ali',
      nickname: 'ali_bek',
      email: 'ali@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    }).valid,
    true
  );
  assert.equal(
    validateBusinessForm({
      name: 'Baraka',
      type: 'other',
      typeNote: 'ab',
      address: 'Yunusobod 4',
      phone: '+998901234567',
    }).valid,
    false
  );
  assert.equal(
    validateProductForm({
      name: 'Tandir non',
      priceText: '5000',
      costPriceText: '2800',
      stockText: '10',
      discountText: '15',
    }).valid,
    true
  );
});

test('formatSoM and getEffectivePrice match firestore.rules math.floor', () => {
  assert.equal(formatSoM(5000), "5 000 so'm");
  const sample: Product = {
    id: 'p1',
    businessId: 'b1',
    businessName: 'Baraka',
    businessType: 'bakery',
    businessAddress: 'Yunusobod',
    businessPhone: '+998901234567',
    name: 'Patir',
    description: '',
    price: 5555,
    costPrice: 3000,
    published: true,
    status: 'available',
    stock: 10,
    discountPercent: 15,
    discountEndsAtMs: null,
    imageUrl: '',
    updatedAtMs: 0,
  };
  // 5555 - floor(5555 * 15 / 100) = 5555 - floor(833.25) = 5555 - 833 = 4722
  assert.equal(getEffectivePrice(sample), 4722);
});

test('getPeriodBounds uses Monday start in Asia/Tashkent', () => {
  // 2026-11-25 is Wednesday in Tashkent (UTC+5)
  const wedTashkent = Date.UTC(2026, 10, 25, 10, 0, 0);
  const { start } = getPeriodBounds('week', wedTashkent);
  // Monday 2026-11-23 00:00:00 UTC+5 == 2026-11-22 19:00:00 UTC
  assert.equal(start, Date.UTC(2026, 10, 22, 19, 0, 0));
});

test('calculateAnalytics requires completed + paid orders and separates gross/net profit', () => {
  const now = Date.UTC(2026, 10, 25, 8, 0, 0);
  const products: Product[] = [
    {
      id: 'p1',
      businessId: 'b1',
      businessName: 'Baraka',
      businessType: 'bakery',
      businessAddress: 'Yunusobod',
      businessPhone: '+998901234567',
      name: 'Non',
      description: '',
      price: 5000,
      costPrice: 3000,
      published: true,
      status: 'available',
      stock: 10,
      discountPercent: 0,
      discountEndsAtMs: null,
      imageUrl: '',
      updatedAtMs: now,
    },
  ];
  const orders: CustomerOrder[] = [
    {
      id: 'o1',
      customerId: 'c1',
      customerName: 'Aziz',
      customerPhone: '',
      businessId: 'b1',
      businessName: 'Baraka',
      productId: 'p1',
      productName: 'Non',
      quantity: 10,
      unitPrice: 5000,
      totalPrice: 50000,
      status: 'completed',
      paymentStatus: 'paid',
      fulfillmentType: 'pickup',
      deliveryAddress: '',
      pickupTimeMs: now,
      createdAtMs: now,
      updatedAtMs: now,
      paidAtMs: now,
    },
    {
      id: 'o2',
      customerId: 'c1',
      customerName: 'Aziz',
      customerPhone: '',
      businessId: 'b1',
      businessName: 'Baraka',
      productId: 'p1',
      productName: 'Non',
      quantity: 5,
      unitPrice: 5000,
      totalPrice: 25000,
      status: 'completed',
      paymentStatus: 'unpaid', // Must NOT count toward revenue!
      fulfillmentType: 'pickup',
      deliveryAddress: '',
      pickupTimeMs: now,
      createdAtMs: now,
      updatedAtMs: now,
    },
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
  assert.equal(report.totalRevenue, 50000);
  assert.equal(report.cogs, 30000);
  assert.equal(report.grossProfit, 20000);
  assert.equal(report.totalExpenses, 8000);
  assert.equal(report.netProfit, 12000);
});
