import { describe, expect, it } from 'vitest';
import {
  applyStockDecrement,
  calculateOrderTotal,
  computeRemainingStock,
  isValidOrderTransition,
} from '../src/services/orderLogic';

describe('orderLogic', () => {
  it('computeRemainingStock rejects quantity below 1 (boundary qty 0 / negative)', () => {
    expect(() => computeRemainingStock(10, 0)).toThrow('kamida 1');
    expect(() => computeRemainingStock(10, -1)).toThrow('kamida 1');
  });

  it('computeRemainingStock rejects quantity above 99 (boundary qty 100)', () => {
    expect(() => computeRemainingStock(150, 100)).toThrow('99 dona');
  });

  it('computeRemainingStock rejects insufficient stock (boundary stock 0 and stock < qty)', () => {
    expect(() => computeRemainingStock(0, 1)).toThrow('Zaxira yetarli emas (0 ta qolgan)');
    expect(() => computeRemainingStock(2, 3)).toThrow('Zaxira yetarli emas (2 ta qolgan)');
  });

  it('computeRemainingStock decrements stock accurately at valid boundaries (stock 1, qty 1 & 99)', () => {
    expect(computeRemainingStock(1, 1)).toBe(0);
    expect(computeRemainingStock(10, 1)).toBe(9);
    expect(computeRemainingStock(99, 99)).toBe(0);
  });

  it('applyStockDecrement transitions status to sold_out at 0 and handles null stock', () => {
    expect(applyStockDecrement(1, 1, 'hot_ready')).toEqual({
      nextStock: 0,
      nextStatus: 'sold_out',
    });
    expect(applyStockDecrement(5, 2, 'hot_ready')).toEqual({
      nextStock: 3,
      nextStatus: 'hot_ready',
    });
    expect(applyStockDecrement(null, 3, 'available')).toEqual({
      nextStock: null,
      nextStatus: 'available',
    });
    expect(() => applyStockDecrement(10, 1.5, 'available')).toThrow('butun son');
  });

  it('calculateOrderTotal computes order total and rejects invalid price/quantity boundaries', () => {
    expect(calculateOrderTotal(5000, 1)).toBe(5000);
    expect(calculateOrderTotal(4722, 99)).toBe(467478);
    expect(() => calculateOrderTotal(0, 1)).toThrow("narxi noto'g'ri");
    expect(() => calculateOrderTotal(-100, 1)).toThrow("narxi noto'g'ri");
    expect(() => calculateOrderTotal(5000, 0)).toThrow('1 dan 99');
    expect(() => calculateOrderTotal(5000, 100)).toThrow('1 dan 99');
  });

  it('isValidOrderTransition enforces customer and owner order status workflows', () => {
    expect(isValidOrderTransition('customer', 'pending', 'cancelled')).toBe(true);
    expect(isValidOrderTransition('customer', 'accepted', 'cancelled')).toBe(false);
    expect(isValidOrderTransition('customer', 'pending', 'completed')).toBe(false);

    expect(isValidOrderTransition('owner', 'pending', 'accepted')).toBe(true);
    expect(isValidOrderTransition('owner', 'accepted', 'ready')).toBe(true);
    expect(isValidOrderTransition('owner', 'ready', 'completed')).toBe(true);
    expect(isValidOrderTransition('owner', 'pending', 'cancelled')).toBe(true);
    expect(isValidOrderTransition('owner', 'accepted', 'cancelled')).toBe(true);
    expect(isValidOrderTransition('owner', 'pending', 'rejected')).toBe(true);
    expect(isValidOrderTransition('owner', 'completed', 'cancelled')).toBe(false);
    expect(isValidOrderTransition('owner', 'cancelled', 'accepted')).toBe(false);
  });
});
