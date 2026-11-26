import type { Dispatch, SetStateAction } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import { expenseRepository } from '../repositories/expenseRepository';
import { orderRepository } from '../repositories/orderRepository';
import { productRepository } from '../repositories/productRepository';
import type {
  Business,
  BusinessTypeKey,
  OrderStatusKey,
  PaymentStatus,
  ProductStatus,
} from '../types/domain';

interface OwnerActionDeps {
  ownerId: string | undefined;
  business: Business | null;
  costMap: Map<string, number>;
  setCostMap: Dispatch<SetStateAction<Map<string, number>>>;
}

export function buildOwnerActions({ ownerId, business, costMap, setCostMap }: OwnerActionDeps) {
  return {
    createBusiness: async (params: {
      name: string;
      type: BusinessTypeKey;
      address: string;
      phone: string;
      typeNote?: string;
    }) => {
      if (!ownerId) throw new Error('Tizimga kiring.');
      await businessRepository.create({ ownerId, ...params });
    },

    updateBusiness: async (params: {
      name: string;
      type: BusinessTypeKey;
      address: string;
      phone: string;
      typeNote?: string;
    }) => {
      if (!business) return;
      await businessRepository.updateDetails({ businessId: business.id, ...params });
    },

    resubmitBusiness: async (params: {
      name: string;
      type: BusinessTypeKey;
      address: string;
      phone: string;
      typeNote?: string;
    }) => {
      if (!business) return;
      await businessRepository.resubmit({ businessId: business.id, ...params });
    },

    createProduct: async (params: {
      category: BusinessTypeKey;
      name: string;
      description: string;
      imageUrl: string;
      price: number;
      costPrice: number;
      stock: number | null;
      discountPercent: number;
      discountEndsAtMs: number | null;
      status: ProductStatus;
      published: boolean;
    }) => {
      if (!business) throw new Error('Avval biznes profilini yarating.');
      const id = await productRepository.create({ business, ...params });
      setCostMap((prev) => new Map(prev).set(id, params.costPrice));
    },

    updateProduct: async (params: {
      productId: string;
      category: BusinessTypeKey;
      name: string;
      description: string;
      imageUrl: string;
      price: number;
      costPrice: number;
      stock: number | null;
      discountPercent: number;
      discountEndsAtMs: number | null;
      status: ProductStatus;
      published: boolean;
    }) => {
      await productRepository.update(params);
      setCostMap((prev) => new Map(prev).set(params.productId, params.costPrice));
    },

    setProductStatus: (productId: string, status: ProductStatus) =>
      productRepository.setStatus(productId, status),

    deleteProduct: (productId: string) => productRepository.delete(productId),

    advanceOrder: async (orderId: string, productId: string, nextStatus: OrderStatusKey) => {
      if (nextStatus === 'completed') {
        const unitCost =
          costMap.get(productId) ?? (await productRepository.getPrivateCostPrice(productId));
        await orderRepository.completeOrderWithUnitCost(orderId, unitCost);
        return;
      }
      await orderRepository.updateStatus(orderId, nextStatus);
    },

    rejectOrder: (orderId: string) =>
      orderRepository.rejectOrderAndRestoreStock(orderId, 'rejected'),

    cancelOrder: (orderId: string) =>
      orderRepository.rejectOrderAndRestoreStock(orderId, 'cancelled'),

    setPaymentStatus: (
      orderId: string,
      status: PaymentStatus,
      options?: { receiptUrl?: string; preservePaidAt?: boolean }
    ) => orderRepository.setPaymentStatus(orderId, status, options),

    addExpense: async (params: { title: string; amount: number; category: string }) => {
      if (!business) throw new Error('Biznes topilmadi.');
      await expenseRepository.create({ businessId: business.id, ...params });
    },

    deleteExpense: (expenseId: string) => expenseRepository.delete(expenseId),
  };
}
