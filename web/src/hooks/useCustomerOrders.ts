import { useEffect, useMemo, useState } from 'react';
import { orderRepository } from '../repositories/orderRepository';
import type { Business, CustomerOrder, FulfillmentType, Product } from '../types/domain';

export function useCustomerOrders(customerId: string | undefined) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadedForUid, setLoadedForUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    const unsub = orderRepository.observeForCustomer(
      customerId,
      (data) => {
        setOrders(data);
        setLoadedForUid(customerId);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoadedForUid(customerId);
      }
    );
    return unsub;
  }, [customerId]);

  const visibleOrders = useMemo(() => (customerId ? orders : []), [customerId, orders]);
  const loading = Boolean(customerId && loadedForUid !== customerId);

  const activeOrders = useMemo(
    () => visibleOrders.filter((o) => ['pending', 'accepted', 'ready'].includes(o.status)),
    [visibleOrders]
  );
  const historyOrders = useMemo(
    () => visibleOrders.filter((o) => ['completed', 'rejected', 'cancelled'].includes(o.status)),
    [visibleOrders]
  );

  const placeOrder = async (params: {
    customerName: string;
    customerPhone: string;
    business: Business;
    product: Product;
    quantity: number;
    pickupTimeMs: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
  }) => {
    if (!customerId) throw new Error('Avval tizimga kiring.');
    return orderRepository.placeOrderTransaction({
      customerId,
      ...params,
    });
  };

  const cancelOrder = async (orderId: string) => {
    return orderRepository.cancelPendingOrder(orderId);
  };

  return {
    orders: visibleOrders,
    activeOrders,
    historyOrders,
    loading,
    error,
    placeOrder,
    cancelOrder,
  };
}
