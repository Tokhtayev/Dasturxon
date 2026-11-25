import { useEffect, useMemo, useState } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import { expenseRepository } from '../repositories/expenseRepository';
import { orderRepository } from '../repositories/orderRepository';
import { productRepository } from '../repositories/productRepository';
import { calculateAnalytics, type AnalyticsPeriod } from '../services/analytics';
import type {
  Business,
  BusinessTypeKey,
  CustomerOrder,
  Expense,
  OrderStatusKey,
  PaymentStatus,
  Product,
  ProductStatus,
} from '../types/domain';

export function useOwnerDashboard(ownerId: string | undefined) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadedOwnerId, setLoadedOwnerId] = useState<string | null>(null);

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [costMap, setCostMap] = useState<Map<string, number>>(new Map());
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [itemCostMap, setItemCostMap] = useState<Map<string, number>>(new Map());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('week');
  const [analyticsAnchorMs, setAnalyticsAnchorMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!ownerId) return;
    const unsub = businessRepository.observeForOwner(
      ownerId,
      (list) => {
        setBusinesses(list);
        setLoadedOwnerId(ownerId);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoadedOwnerId(ownerId);
      }
    );
    return unsub;
  }, [ownerId]);

  const ownerBusinesses = useMemo(() => (ownerId ? businesses : []), [ownerId, businesses]);
  const businessesLoaded = !ownerId || loadedOwnerId === ownerId;

  const business = useMemo(
    () =>
      ownerBusinesses.find((b) => b.status === 'approved') ??
      ownerBusinesses.find((b) => b.status === 'pending') ??
      ownerBusinesses.find((b) => b.status === 'rejected') ??
      ownerBusinesses[0] ??
      null,
    [ownerBusinesses]
  );

  const businessId = business?.id;

  useEffect(() => {
    if (!businessId) return;

    const unsubProds = productRepository.observeForBusiness(
      businessId,
      (list) => {
        setRawProducts(list);
        setAnalyticsAnchorMs(Date.now());
      },
      (err) => setError(err.message)
    );
    const unsubOrders = orderRepository.observeForBusiness(
      businessId,
      (list) => {
        setOrders(list);
        setAnalyticsAnchorMs(Date.now());
      },
      (err) => setError(err.message)
    );
    const unsubExpenses = expenseRepository.observeForBusiness(
      businessId,
      (list) => {
        setExpenses(list);
        setAnalyticsAnchorMs(Date.now());
      },
      (err) => setError(err.message)
    );

    return () => {
      unsubProds();
      unsubOrders();
      unsubExpenses();
    };
  }, [businessId]);

  const scopedProducts = useMemo(() => (businessId ? rawProducts : []), [businessId, rawProducts]);
  const scopedOrders = useMemo(() => (businessId ? orders : []), [businessId, orders]);
  const scopedExpenses = useMemo(() => (businessId ? expenses : []), [businessId, expenses]);

  const productIdsKey = useMemo(
    () => scopedProducts.map((p) => p.id).sort().join(','),
    [scopedProducts]
  );

  useEffect(() => {
    if (!productIdsKey) return;
    let active = true;
    const ids = productIdsKey.split(',');
    productRepository.loadPrivateCostPrices(ids).then((map) => {
      if (active) setCostMap(map);
    });
    return () => {
      active = false;
    };
  }, [productIdsKey]);

  const completedOrderIdsKey = useMemo(
    () =>
      scopedOrders
        .filter((o) => o.status === 'completed')
        .map((o) => o.id)
        .sort()
        .join(','),
    [scopedOrders]
  );

  useEffect(() => {
    if (!completedOrderIdsKey) return;
    let active = true;
    orderRepository.loadCompletedItemCosts(completedOrderIdsKey.split(',')).then((map) => {
      if (active) setItemCostMap(map);
    });
    return () => {
      active = false;
    };
  }, [completedOrderIdsKey]);

  const products = useMemo(
    () =>
      scopedProducts.map((p) => ({
        ...p,
        costPrice: costMap.get(p.id) ?? 0,
      })),
    [scopedProducts, costMap]
  );

  const report = useMemo(
    () =>
      calculateAnalytics(
        scopedOrders,
        scopedExpenses,
        products,
        analyticsPeriod,
        analyticsAnchorMs,
        itemCostMap
      ),
    [scopedOrders, scopedExpenses, products, analyticsPeriod, analyticsAnchorMs, itemCostMap]
  );

  return {
    business,
    businessesLoaded,
    products,
    orders: scopedOrders,
    expenses: scopedExpenses,
    report,
    analyticsPeriod,
    setAnalyticsPeriod: (period: AnalyticsPeriod) => {
      setAnalyticsAnchorMs(Date.now());
      setAnalyticsPeriod(period);
    },
    error,
    clearError: () => setError(null),

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
      name: string;
      description: string;
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
      name: string;
      description: string;
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

    setProductStatus: async (productId: string, status: ProductStatus) => {
      await productRepository.setStatus(productId, status);
    },

    deleteProduct: async (productId: string) => {
      await productRepository.delete(productId);
    },

    advanceOrder: async (orderId: string, productId: string, nextStatus: OrderStatusKey) => {
      if (nextStatus === 'completed') {
        const unitCost =
          costMap.get(productId) ?? (await productRepository.getPrivateCostPrice(productId));
        await orderRepository.completeOrderWithUnitCost(orderId, unitCost);
        return;
      }
      await orderRepository.updateStatus(orderId, nextStatus);
    },

    rejectOrder: async (orderId: string) => {
      await orderRepository.rejectOrderAndRestoreStock(orderId);
    },

    setPaymentStatus: async (orderId: string, status: PaymentStatus) => {
      await orderRepository.setPaymentStatus(orderId, status);
    },

    addExpense: async (params: { title: string; amount: number; category: string }) => {
      if (!business) throw new Error('Biznes topilmadi.');
      await expenseRepository.create({ businessId: business.id, ...params });
    },

    deleteExpense: async (expenseId: string) => {
      await expenseRepository.delete(expenseId);
    },
  };
}
