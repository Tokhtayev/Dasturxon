import { useEffect, useMemo, useState } from 'react';
import { orderRepository } from '../repositories/orderRepository';
import { IN_PROGRESS_ORDER_STATUSES, TERMINAL_ORDER_STATUSES } from '../services/constants';
import type { Business, CustomerOrder, FulfillmentType, OrderType, Product } from '../types/domain';

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
    () => visibleOrders.filter((o) => IN_PROGRESS_ORDER_STATUSES.includes(o.status)),
    [visibleOrders]
  );
  const historyOrders = useMemo(
    () => visibleOrders.filter((o) => TERMINAL_ORDER_STATUSES.includes(o.status)),
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
    advanceReceiptUrl?: string;
    orderType?: OrderType;
  }) => {
    if (!customerId) throw new Error('Avval tizimga kiring.');
    return orderRepository.placeOrderTransaction({
      customerId,
      ...params,
    });
  };

  const submitAdvanceReceipt = async (orderId: string, receiptUrl: string) => {
    return orderRepository.submitAdvanceReceipt(orderId, receiptUrl);
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
    submitAdvanceReceipt,
    cancelOrder,
  };
}
