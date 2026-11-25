import { useEffect, useState } from 'react';
import {
  INITIAL_BUSINESSES,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
} from './data/demoData';
import { TRANSLATIONS } from './i18n/translations';
import type {
  AppNotification,
  AppRole,
  Business,
  BusinessStatus,
  CustomerOrder,
  Expense,
  FulfillmentType,
  LanguageCode,
  OrderStatusKey,
  PaymentStatus,
  Product,
  ProductStatus,
} from './types/dasturxon';
import { getEffectivePrice } from './utils/analytics';
import { ArchitectureSecuritySection } from './components/ArchitectureSecuritySection';
import { FeaturesSection } from './components/FeaturesSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { LiveWorkspace } from './components/LiveWorkspace';
import { Navbar } from './components/Navbar';
import { PriceCompareAndMap } from './components/PriceCompareAndMap';

export function App() {
  const [lang, setLang] = useState<LanguageCode>('uz');
  const [isDark, setIsDark] = useState(false);
  const [activeRole, setActiveRole] = useState<AppRole>('customer');
  const [focusedShopId, setFocusedShopId] = useState<string | null>(null);

  const [userName, setUserName] = useState('Azizbek Karimov');
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const t = TRANSLATIONS[lang];

  const handleJumpToWorkspace = (role: AppRole) => {
    setActiveRole(role);
    document.getElementById('live-app')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectShopFromDirectory = (businessId: string) => {
    setActiveRole('customer');
    setFocusedShopId(businessId);
    document.getElementById('live-app')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePlaceOrder = (payload: {
    product: Product;
    quantity: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
    customerPhone: string;
    pickupTime: number;
  }) => {
    const unitPrice = getEffectivePrice(payload.product);
    const totalPrice = unitPrice * payload.quantity;
    const orderNum = `№${2720 + orders.length}`;
    const newOrder: CustomerOrder = {
      id: `order_${Date.now()}`,
      orderNumber: orderNum,
      customerId: 'demo_customer_1',
      customerName: userName,
      customerPhone: payload.customerPhone || '+998 90 123 45 67',
      businessId: payload.product.businessId,
      businessName: payload.product.businessName,
      productId: payload.product.id,
      productName: payload.product.name,
      quantity: payload.quantity,
      unitPrice,
      totalPrice,
      status: 'pending',
      paymentStatus: 'unpaid',
      fulfillmentType: payload.fulfillmentType,
      deliveryAddress: payload.deliveryAddress,
      pickupTime: payload.pickupTime,
      createdAt: Date.now(),
      items: [
        {
          productId: payload.product.id,
          name: payload.product.name,
          qty: payload.quantity,
          unitPrice,
        },
      ],
    };

    // Atomic-style stock decrement
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== payload.product.id || p.stock === null) return p;
        const remaining = Math.max(0, p.stock - payload.quantity);
        return {
          ...p,
          stock: remaining,
          status: remaining === 0 ? 'sold_out' : p.status,
        };
      })
    );

    setOrders((prev) => [newOrder, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: `Yangi buyurtma ${orderNum}`,
        message: `${payload.product.businessName}: ${payload.quantity} ta ${payload.product.name} yuborildi.`,
        timeAgo: 'Hozirgina',
        icon: '🛍️',
        isRead: false,
        targetTab: 'orders',
      },
      ...prev,
    ]);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId && o.status === 'pending' ? { ...o, status: 'cancelled' } : o))
    );
  };

  const handleAddProduct = (prod: Omit<Product, 'id'>) => {
    setProducts((prev) => [{ ...prod, id: `prod_${Date.now()}` }, ...prev]);
  };

  const handleUpdateProductStatus = (productId: string, status: ProductStatus) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status } : p)));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatusKey) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        if (status === 'completed') {
          const prod = products.find((p) => p.id === o.productId);
          const unitCost = prod?.costPrice ?? 0;
          const itemsWithCost = (o.items ?? []).map((it) => ({ ...it, unitCost }));
          return {
            ...o,
            status,
            items: itemsWithCost,
          };
        }
        return { ...o, status };
      })
    );
  };

  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus,
              paidAt: paymentStatus === 'paid' ? Date.now() : undefined,
            }
          : o
      )
    );
  };

  const handleAddExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    setExpenses((prev) => [{ ...expense, id: `exp_${Date.now()}`, createdAt: Date.now() }, ...prev]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const handleUpdateBusiness = (id: string, patch: Partial<Business>) => {
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handleSetBusinessStatus = (
    id: string,
    status: BusinessStatus,
    rejectionReason?: string
  ) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status, rejectionReason } : b))
    );
  };

  const handleResetDemo = () => {
    setBusinesses(INITIAL_BUSINESSES);
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setExpenses(INITIAL_EXPENSES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setFocusedShopId(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        t={t}
        lang={lang}
        onLangChange={setLang}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
      />

      <main className="flex-1">
        <HeroSection t={t} onJumpToWorkspace={handleJumpToWorkspace} />

        <LiveWorkspace
          t={t}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          businesses={businesses}
          products={products}
          orders={orders}
          expenses={expenses}
          notifications={notifications}
          userName={userName}
          onUpdateUserName={setUserName}
          onMarkNotificationsRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
          }
          onPlaceOrder={handlePlaceOrder}
          onCancelOrder={handleCancelOrder}
          onAddProduct={handleAddProduct}
          onUpdateProductStatus={handleUpdateProductStatus}
          onDeleteProduct={handleDeleteProduct}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onUpdateBusiness={handleUpdateBusiness}
          onSetBusinessStatus={handleSetBusinessStatus}
          onResetDemo={handleResetDemo}
          focusedShopId={focusedShopId}
          onClearFocusedShop={() => setFocusedShopId(null)}
        />

        <PriceCompareAndMap
          t={t}
          businesses={businesses}
          products={products}
          onSelectShop={handleSelectShopFromDirectory}
        />

        <FeaturesSection t={t} />

        <ArchitectureSecuritySection t={t} />
      </main>

      <Footer t={t} />
    </div>
  );
}

export default App;
