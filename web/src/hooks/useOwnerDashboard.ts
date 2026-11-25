import { useEffect, useMemo, useState } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import { expenseRepository } from '../repositories/expenseRepository';
import { orderRepository } from '../repositories/orderRepository';
import { productRepository } from '../repositories/productRepository';
import { calculateAnalytics, type AnalyticsPeriod } from '../services/analytics';
import type { Business, CustomerOrder, Expense, Product } from '../types/domain';
import { buildOwnerActions } from './ownerActions';

function useBusinessStreams(businessId: string | undefined, onError: (msg: string) => void) {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [costMap, setCostMap] = useState<Map<string, number>>(new Map());
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [itemCostMap, setItemCostMap] = useState<Map<string, number>>(new Map());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analyticsAnchorMs, setAnalyticsAnchorMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!businessId) return;
    const unsubProds = productRepository.observeForBusiness(
      businessId,
      (list) => {
        setRawProducts(list);
        setAnalyticsAnchorMs(Date.now());
      },
      (err) => onError(err.message)
    );
    const unsubOrders = orderRepository.observeForBusiness(
      businessId,
      (list) => {
        setOrders(list);
        setAnalyticsAnchorMs(Date.now());
      },
      (err) => onError(err.message)
    );
    const unsubExpenses = expenseRepository.observeForBusiness(
      businessId,
      (list) => {
        setExpenses(list);
        setAnalyticsAnchorMs(Date.now());
      },
      (err) => onError(err.message)
    );
    return () => {
      unsubProds();
      unsubOrders();
      unsubExpenses();
    };
  }, [businessId, onError]);

  const productIdsKey = useMemo(
    () =>
      (businessId ? rawProducts : [])
        .map((p) => p.id)
        .sort()
        .join(','),
    [businessId, rawProducts]
  );

  useEffect(() => {
    if (!productIdsKey) return;
    let active = true;
    productRepository.loadPrivateCostPrices(productIdsKey.split(',')).then((map) => {
      if (active) setCostMap(map);
    });
    return () => {
      active = false;
    };
  }, [productIdsKey]);

  const completedOrderIdsKey = useMemo(
    () =>
      (businessId ? orders : [])
        .filter((o) => o.status === 'completed')
        .map((o) => o.id)
        .sort()
        .join(','),
    [businessId, orders]
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

  return {
    rawProducts,
    costMap,
    setCostMap,
    orders,
    itemCostMap,
    expenses,
    analyticsAnchorMs,
    setAnalyticsAnchorMs,
  };
}

export function useOwnerDashboard(ownerId: string | undefined) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadedOwnerId, setLoadedOwnerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('week');

  useEffect(() => {
    if (!ownerId) return;
    return businessRepository.observeForOwner(
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
  const streams = useBusinessStreams(businessId, setError);
  const scopedProducts = useMemo(
    () => (businessId ? streams.rawProducts : []),
    [businessId, streams.rawProducts]
  );
  const scopedOrders = useMemo(
    () => (businessId ? streams.orders : []),
    [businessId, streams.orders]
  );
  const scopedExpenses = useMemo(
    () => (businessId ? streams.expenses : []),
    [businessId, streams.expenses]
  );

  const products = useMemo(
    () => scopedProducts.map((p) => ({ ...p, costPrice: streams.costMap.get(p.id) ?? 0 })),
    [scopedProducts, streams.costMap]
  );

  const report = useMemo(
    () =>
      calculateAnalytics(
        scopedOrders,
        scopedExpenses,
        products,
        analyticsPeriod,
        streams.analyticsAnchorMs,
        streams.itemCostMap
      ),
    [
      scopedOrders,
      scopedExpenses,
      products,
      analyticsPeriod,
      streams.analyticsAnchorMs,
      streams.itemCostMap,
    ]
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
      streams.setAnalyticsAnchorMs(Date.now());
      setAnalyticsPeriod(period);
    },
    error,
    clearError: () => setError(null),
    ...buildOwnerActions({
      ownerId,
      business,
      costMap: streams.costMap,
      setCostMap: streams.setCostMap,
    }),
  };
}
