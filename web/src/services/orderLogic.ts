import type { OrderStatusKey, ProductStatus } from '../types/domain';
import { MAX_ORDER_QUANTITY, MAX_PRICE_SOM, MIN_ORDER_QUANTITY } from './constants.ts';

/**
 * Computes remaining stock after an order using explicit boundary checks.
 * Returns updated stock count or throws if quantity violates limits or stock.
 */
export function computeRemainingStock(currentStock: number, quantity: number): number {
  if (quantity < MIN_ORDER_QUANTITY) {
    throw new Error("Buyurtma miqdori kamida 1 bo'lishi kerak.");
  }
  if (quantity > MAX_ORDER_QUANTITY) {
    throw new Error("Bir buyurtmada ko'pi bilan 99 dona tanlash mumkin.");
  }
  if (quantity > currentStock) {
    throw new Error(`Zaxira yetarli emas (${currentStock} ta qolgan).`);
  }
  return currentStock - quantity;
}

export function applyStockDecrement(
  currentStock: number | null,
  quantity: number,
  currentStatus: ProductStatus
): { nextStock: number | null; nextStatus: ProductStatus } {
  if (!Number.isInteger(quantity)) {
    throw new Error("Buyurtma miqdori butun son bo'lishi kerak.");
  }
  if (currentStock === null) {
    computeRemainingStock(MAX_ORDER_QUANTITY, quantity);
    return { nextStock: null, nextStatus: currentStatus };
  }
  const nextStock = computeRemainingStock(currentStock, quantity);
  return {
    nextStock,
    nextStatus: nextStock === 0 ? 'sold_out' : currentStatus,
  };
}

export function calculateOrderTotal(unitPrice: number, quantity: number): number {
  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > MAX_PRICE_SOM) {
    throw new Error("Mahsulot narxi noto'g'ri.");
  }
  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_ORDER_QUANTITY ||
    quantity > MAX_ORDER_QUANTITY
  ) {
    throw new Error("Buyurtma miqdori 1 dan 99 gacha bo'lishi kerak.");
  }
  return Math.round(unitPrice) * quantity;
}

const OWNER_TRANSITIONS: Record<OrderStatusKey, readonly OrderStatusKey[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['ready', 'rejected'],
  ready: ['completed', 'rejected'],
  completed: [],
  rejected: [],
  cancelled: [],
};

export function isValidOrderTransition(
  actor: 'customer' | 'owner',
  currentStatus: OrderStatusKey,
  nextStatus: OrderStatusKey
): boolean {
  if (actor === 'customer') {
    return currentStatus === 'pending' && nextStatus === 'cancelled';
  }
  return OWNER_TRANSITIONS[currentStatus].includes(nextStatus);
}
