import { useEffect, useMemo, useState } from 'react';
import { orderRepository } from '../repositories/orderRepository';
import type { Business, CustomerOrder, FulfillmentType, Product } from '../types/domain';

export function useCustomerOrders(customerId: string | undefined) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = orderRepository.observeForCustomer(
      customerId,
      (data) => {
        setOrders(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [customerId]);

  const activeOrders = useMemo(
    () => orders.filter((o) => ['pending', 'accepted', 'ready'].includes(o.status)),
    [orders]
  );
  const historyOrders = useMemo(
    () => orders.filter((o) => ['completed', 'rejected', 'cancelled'].includes(o.status)),
    [orders]
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
    if (!customerId) throw new Error("Avval tizimga kiring.");
    return orderRepository.placeOrderTransaction({
      customerId,
      ...params,
    });
  };

  const cancelOrder = async (orderId: string) => {
    return orderRepository.cancelPendingOrder(orderId);
  };

  return {
    orders,
    activeOrders,
    historyOrders,
    loading,
    error,
    placeOrder,
    cancelOrder,
  };
}
