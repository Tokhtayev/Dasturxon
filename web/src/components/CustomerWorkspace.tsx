import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Store,
  Truck,
  User,
  X,
} from 'lucide-react';
import type {
  AppNotification,
  Business,
  BusinessTypeKey,
  CustomerOrder,
  FulfillmentType,
  Product,
} from '../types/dasturxon';
import { BUSINESS_TYPES, PROMO_BANNERS } from '../data/demoData';
import { formatSoM, getEffectivePrice, isDiscountActive } from '../utils/analytics';
import { DxLogo } from './DxLogo';
import { StatusChip } from './StatusChip';

interface CustomerWorkspaceProps {
  businesses: Business[];
  products: Product[];
  orders: CustomerOrder[];
  notifications: AppNotification[];
  userName: string;
  onUpdateUserName: (name: string) => void;
  onMarkNotificationsRead: () => void;
  onPlaceOrder: (payload: {
    product: Product;
    quantity: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
    customerPhone: string;
    pickupTime: number;
  }) => void;
  onCancelOrder: (orderId: string) => void;
  onSwitchToOwner: () => void;
  focusedShopId: string | null;
  onClearFocusedShop: () => void;
}

type CustomerTab = 'home' | 'shops' | 'orders' | 'profile';

export const CustomerWorkspace: React.FC<CustomerWorkspaceProps> = ({
  businesses,
  products,
  orders,
  notifications,
  userName,
  onUpdateUserName,
  onMarkNotificationsRead,
  onPlaceOrder,
  onCancelOrder,
  onSwitchToOwner,
  focusedShopId,
  onClearFocusedShop,
}) => {
  const [activeTab, setActiveTab] = useState<CustomerTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BusinessTypeKey>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [orderSegment, setOrderSegment] = useState<'active' | 'history'>('active');
  const [notifOpen, setNotifOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Checkout state
  const [qty, setQty] = useState(1);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('+998 90 123 45 67');
  const [pickupPreset, setPickupPreset] = useState<'30m' | '1h' | '2h' | '18h'>('1h');
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const effectiveShopId = focusedShopId ?? selectedShopId;
  const approvedBusinesses = useMemo(
    () => businesses.filter((b) => b.status === 'approved'),
    [businesses]
  );
  const approvedBizIds = useMemo(
    () => new Set(approvedBusinesses.map((b) => b.id)),
    [approvedBusinesses]
  );

  const visibleProducts = useMemo(
    () => products.filter((p) => p.published && approvedBizIds.has(p.businessId)),
    [products, approvedBizIds]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleProducts.filter((p) => {
      const catMatch = categoryFilter === 'all' || p.businessType === categoryFilter;
      const qMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [visibleProducts, categoryFilter, searchQuery]);

  const hotReadyProducts = useMemo(
    () => visibleProducts.filter((p) => p.status === 'hot_ready'),
    [visibleProducts]
  );
  const discountedProducts = useMemo(
    () => visibleProducts.filter((p) => isDiscountActive(p)),
    [visibleProducts]
  );

  const filteredShops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return approvedBusinesses.filter((b) => {
      const catMatch = categoryFilter === 'all' || b.type === categoryFilter;
      const qMatch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [approvedBusinesses, categoryFilter, searchQuery]);

  const customerOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  );
  const activeOrders = useMemo(
    () => customerOrders.filter((o) => ['pending', 'accepted', 'ready'].includes(o.status)),
    [customerOrders]
  );
  const historyOrders = useMemo(
    () => customerOrders.filter((o) => ['completed', 'rejected', 'cancelled'].includes(o.status)),
    [customerOrders]
  );

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const openCheckout = (product: Product) => {
    setCheckoutProduct(product);
    setQty(1);
    setFulfillment('pickup');
    setCheckoutErr(null);
  };

  const getPickupMillis = (): number => {
    const now = Date.now();
    if (pickupPreset === '30m') return now + 30 * 60 * 1000;
    if (pickupPreset === '1h') return now + 60 * 60 * 1000;
    if (pickupPreset === '2h') return now + 2 * 60 * 60 * 1000;
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    if (d.getTime() < now) d.setDate(d.getDate() + 1);
    return d.getTime();
  };

  const submitCheckout = () => {
    if (!checkoutProduct) return;
    if (checkoutProduct.stock !== null && qty > checkoutProduct.stock) {
      setCheckoutErr(`Zaxira yetarli emas (${checkoutProduct.stock} ta mavjud)`);
      return;
    }
    if (fulfillment === 'delivery' && (!deliveryAddress.trim() || !contactPhone.trim())) {
      setCheckoutErr('Yetkazib berish uchun manzil va telefon raqamini kiriting.');
      return;
    }
    onPlaceOrder({
      product: checkoutProduct,
      quantity: qty,
      fulfillmentType: fulfillment,
      deliveryAddress: deliveryAddress.trim(),
      customerPhone: contactPhone.trim(),
      pickupTime: getPickupMillis(),
    });
    setCheckoutProduct(null);
    setSelectedProduct(null);
    setActiveTab('orders');
    setOrderSegment('active');
    setToastMsg('Buyurtmangiz muvaffaqiyatli yuborildi! 🎉');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const selectedShop = effectiveShopId
    ? businesses.find((b) => b.id === effectiveShopId) ?? null
    : null;

  return (
    <div
      className="rounded-3xl border overflow-hidden shadow-xl flex flex-col"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    >
      {/* Top App Bar (DxTopBar) */}
      <div
        className="px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 relative"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-center gap-3">
          {selectedShop ? (
            <button
              type="button"
              onClick={() => {
                setSelectedShopId(null);
                onClearFocusedShop();
              }}
              className="inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl border cursor-pointer"
              style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-text)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Orqaga
            </button>
          ) : (
            <DxLogo size={32} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToOwner}
            className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--dx-primary-container)',
              color: 'var(--dx-on-primary-container)',
            }}
          >
            🏪 Biznesga o‘tish
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedShopId(null);
              onClearFocusedShop();
              setActiveTab('profile');
            }}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--dx-surface-variant)', color: 'var(--dx-text)' }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <span>{userName}</span>
          </button>

          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Bildirishnomalar"
            className="relative p-2 rounded-xl border cursor-pointer"
            style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-text)' }}
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white"
                style={{ backgroundColor: '#BA1A1A' }}
              >
                {unreadNotifs}
              </span>
            )}
          </button>
        </div>

        {/* Notifications Popover */}
        {notifOpen && (
          <div
            className="absolute right-4 top-16 z-30 w-80 sm:w-96 rounded-2xl border shadow-2xl p-4 space-y-3"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Bildirishnomalar</span>
              <div className="flex items-center gap-2">
                {unreadNotifs > 0 && (
                  <button
                    type="button"
                    onClick={onMarkNotificationsRead}
                    className="text-xs font-bold cursor-pointer"
                    style={{ color: 'var(--dx-primary)' }}
                  >
                    Barchasini o‘qish
                  </button>
                )}
                <button type="button" onClick={() => setNotifOpen(false)} className="p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onMarkNotificationsRead();
                    setNotifOpen(false);
                    setActiveTab(n.targetTab);
                  }}
                  className="w-full text-left p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer"
                  style={{
                    backgroundColor: n.isRead ? 'var(--dx-bg)' : 'var(--dx-primary-container)',
                    borderColor: 'var(--dx-border)',
                  }}
                >
                  <span className="text-lg">{n.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold">{n.title}</div>
                    <div className="text-[11px] mt-0.5 leading-snug opacity-85">{n.message}</div>
                    <div className="text-[10px] mt-1 opacity-65">{n.timeAgo}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast banner */}
      {toastMsg && (
        <div
          className="px-4 py-2.5 text-xs sm:text-sm font-bold text-center"
          style={{ backgroundColor: 'var(--dx-tertiary-container)', color: 'var(--dx-on-tertiary-container)' }}
        >
          {toastMsg}
        </div>
      )}

      {/* Workspace Body */}
      <div className="p-4 sm:p-6 min-h-[560px]">
        {/* Shop Detail View */}
        {selectedShop ? (
          <ShopDetailPanel
            shop={selectedShop}
            products={visibleProducts.filter((p) => p.businessId === selectedShop.id)}
            onProductClick={setSelectedProduct}
            onOrderClick={openCheckout}
            onSeeAllProducts={() => {
              setSearchQuery(selectedShop.name);
              setSelectedShopId(null);
              onClearFocusedShop();
              setActiveTab('home');
            }}
          />
        ) : (
          <>
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Search + Filter Chips */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--dx-muted)' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Mahsulot yoki do‘kon qidirish… (masalan: Tandir non, Somsa, Osh)"
                      className="w-full pl-10 pr-9 py-3 rounded-2xl border text-sm focus:outline-none"
                      style={{
                        backgroundColor: 'var(--dx-surface)',
                        borderColor: 'var(--dx-border)',
                        color: 'var(--dx-text)',
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors"
                      style={{
                        backgroundColor: categoryFilter === 'all' ? 'var(--dx-primary)' : 'var(--dx-surface)',
                        color: categoryFilter === 'all' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                        borderColor: categoryFilter === 'all' ? 'var(--dx-primary)' : 'var(--dx-border)',
                      }}
                    >
                      Barchasi
                    </button>
                    {BUSINESS_TYPES.map((bt) => {
                      const active = categoryFilter === bt.storedValue;
                      return (
                        <button
                          key={bt.storedValue}
                          type="button"
                          onClick={() => setCategoryFilter(bt.storedValue)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors"
                          style={{
                            backgroundColor: active ? 'var(--dx-primary)' : 'var(--dx-surface)',
                            color: active ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                            borderColor: active ? 'var(--dx-primary)' : 'var(--dx-border)',
                          }}
                        >
                          {bt.icon} {bt.labelUz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Promo Banners Carousel */}
                {!searchQuery && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base flex items-center gap-1.5">
                        <span>🔥</span> Aksiyalar va Yangiliklar
                      </h3>
                      <span
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--dx-primary-container)',
                          color: 'var(--dx-on-primary-container)',
                        }}
                      >
                        Reklama
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {PROMO_BANNERS.map((banner) => (
                        <button
                          key={banner.id}
                          type="button"
                          onClick={() => setCategoryFilter(banner.targetCategory)}
                          className="text-left rounded-2xl p-4 text-white relative overflow-hidden shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[146px]"
                          style={{ background: banner.gradient }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/25">
                              {banner.tag}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/30">
                              {banner.badge}
                            </span>
                          </div>
                          <div className="flex items-end justify-between gap-2 mt-3">
                            <div className="min-w-0">
                              <div className="font-extrabold text-sm leading-tight">{banner.title}</div>
                              <div className="text-[11px] text-white/85 line-clamp-2 mt-1">{banner.subtitle}</div>
                            </div>
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/40 shrink-0"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hot & Ready Shelf */}
                {!searchQuery && categoryFilter === 'all' && hotReadyProducts.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full animate-live-dot" style={{ backgroundColor: 'var(--dx-tertiary)' }} />
                      Hozir mavjud ({hotReadyProducts.length})
                    </h3>
                    <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2">
                      {hotReadyProducts.map((p) => (
                        <div key={`hot_${p.id}`} className="w-64 shrink-0">
                          <ProductCardItem
                            product={p}
                            onCardClick={() => setSelectedProduct(p)}
                            onOrderClick={() => openCheckout(p)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discounts Shelf */}
                {!searchQuery && categoryFilter === 'all' && discountedProducts.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-base">🏷️ Chegirmalar ({discountedProducts.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {discountedProducts.map((p) => (
                        <ProductCardItem
                          key={`disc_${p.id}`}
                          product={p}
                          onCardClick={() => setSelectedProduct(p)}
                          onOrderClick={() => openCheckout(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Products Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base">
                      {searchQuery || categoryFilter !== 'all'
                        ? `Natijalar (${filteredProducts.length})`
                        : `Barcha mahsulotlar (${filteredProducts.length})`}
                    </h3>
                    {(searchQuery || categoryFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                        }}
                        className="text-xs font-bold cursor-pointer"
                        style={{ color: 'var(--dx-primary)' }}
                      >
                        Filtrni tozalash
                      </button>
                    )}
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div
                      className="rounded-2xl p-10 text-center border"
                      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                    >
                      <div className="text-3xl mb-2">🥖</div>
                      <div className="font-bold">Hozircha mahsulotlar mavjud emas</div>
                      <p className="text-xs mt-1" style={{ color: 'var(--dx-muted)' }}>
                        Boshqa toifani tanlang yoki qidiruv so‘zini o‘zgartiring.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((p) => (
                        <ProductCardItem
                          key={p.id}
                          product={p}
                          onCardClick={() => setSelectedProduct(p)}
                          onOrderClick={() => openCheckout(p)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SHOPS */}
            {activeTab === 'shops' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Mahalliy do‘konlar ({filteredShops.length})</h3>
                  <span className="text-xs" style={{ color: 'var(--dx-muted)' }}>
                    Faqat Admin tasdiqlagan bizneslar
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredShops.map((shop) => {
                    const count = visibleProducts.filter((p) => p.businessId === shop.id).length;
                    const hotCount = visibleProducts.filter(
                      (p) => p.businessId === shop.id && p.status === 'hot_ready'
                    ).length;
                    return (
                      <button
                        key={shop.id}
                        type="button"
                        onClick={() => setSelectedShopId(shop.id)}
                        className="text-left p-4 rounded-2xl border flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold shrink-0"
                          style={{
                            backgroundColor: 'var(--dx-primary-container)',
                            color: 'var(--dx-on-primary-container)',
                          }}
                        >
                          {shop.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">{shop.name}</div>
                          <div className="text-xs truncate mt-0.5" style={{ color: 'var(--dx-muted)' }}>
                            {shop.address}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold">
                            <span style={{ color: 'var(--dx-secondary)' }}>{shop.phone}</span>
                            <span style={{ color: 'var(--dx-tertiary)' }}>
                              {count} mahsulot · {hotCount} issiq
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
                  <button
                    type="button"
                    onClick={() => setOrderSegment('active')}
                    className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor: orderSegment === 'active' ? 'var(--dx-primary)' : 'var(--dx-surface)',
                      color: orderSegment === 'active' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                    }}
                  >
                    Faol ({activeOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSegment('history')}
                    className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor: orderSegment === 'history' ? 'var(--dx-primary)' : 'var(--dx-surface)',
                      color: orderSegment === 'history' ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                    }}
                  >
                    Tarix ({historyOrders.length})
                  </button>
                </div>

                {(orderSegment === 'active' ? activeOrders : historyOrders).length === 0 ? (
                  <div className="p-10 text-center rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                    <div className="text-2xl mb-2">🛒</div>
                    <div className="font-bold text-sm">
                      {orderSegment === 'active'
                        ? 'Faol buyurtmalaringiz yo‘q.'
                        : 'Buyurtmalar tarixi hozircha bo‘sh.'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(orderSegment === 'active' ? activeOrders : historyOrders).map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl border space-y-3"
                        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold" style={{ color: 'var(--dx-muted)' }}>
                              {order.orderNumber} · {order.businessName}
                            </div>
                            <div className="font-bold text-base mt-0.5">
                              {order.productName} ({order.quantity} dona)
                            </div>
                          </div>
                          <StatusChip status={order.status} />
                        </div>

                        {/* 4-Step Timeline */}
                        {!['rejected', 'cancelled'].includes(order.status) && (
                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            {(['pending', 'accepted', 'ready', 'completed'] as const).map((step, idx) => {
                              const rank: Record<string, number> = {
                                pending: 0,
                                accepted: 1,
                                ready: 2,
                                completed: 3,
                              };
                              const reached = (rank[order.status] ?? 0) >= idx;
                              const labelMap = {
                                pending: 'Kutilmoqda',
                                accepted: 'Qabul',
                                ready: 'Tayyor',
                                completed: 'Yakun',
                              };
                              return (
                                <div key={step} className="space-y-1">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                      backgroundColor: reached ? 'var(--dx-tertiary)' : 'var(--dx-surface-variant)',
                                    }}
                                  />
                                  <div
                                    className="text-[10px] font-bold text-center"
                                    style={{ color: reached ? 'var(--dx-tertiary)' : 'var(--dx-muted)' }}
                                  >
                                    {labelMap[step]}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs" style={{ borderColor: 'var(--dx-border)' }}>
                          <div className="flex flex-wrap items-center gap-3" style={{ color: 'var(--dx-muted)' }}>
                            <span>
                              {order.fulfillmentType === 'delivery' ? '🚚 Yetkazib berish' : '🛍️ Olib ketish'}
                            </span>
                            <span>
                              To‘lov: {order.paymentStatus === 'paid' ? '✅ To‘langan' : '⏳ Joyida (naqd/QR)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
                              {formatSoM(order.totalPrice)}
                            </span>
                            {order.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => onCancelOrder(order.id)}
                                className="px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer"
                                style={{
                                  borderColor: 'var(--dx-error)',
                                  color: 'var(--dx-error)',
                                }}
                              >
                                Bekor qilish
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="max-w-xl mx-auto space-y-4">
                <div
                  className="rounded-3xl p-6 border text-center space-y-3"
                  style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                >
                  <div
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-extrabold"
                    style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
                  >
                    {userName.slice(0, 1).toUpperCase()}
                  </div>

                  {editingName ? (
                    <div className="flex items-center gap-2 max-w-xs mx-auto">
                      <input
                        type="text"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border text-sm"
                        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (nameDraft.trim().length >= 2) {
                            onUpdateUserName(nameDraft.trim());
                            setEditingName(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                        style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                      >
                        Saqlash
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-lg">{userName}</div>
                      <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>azizbek.karimov@dasturxon.uz</div>
                      <button
                        type="button"
                        onClick={() => {
                          setNameDraft(userName);
                          setEditingName(true);
                        }}
                        className="mt-2 text-xs font-bold cursor-pointer"
                        style={{ color: 'var(--dx-primary)' }}
                      >
                        Ismni tahrirlash
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center gap-2 pt-2">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
                    >
                      🛒 Xaridor
                    </span>
                    <button
                      type="button"
                      onClick={onSwitchToOwner}
                      className="text-xs font-bold px-3 py-1 rounded-full cursor-pointer"
                      style={{ backgroundColor: 'var(--dx-secondary-container)', color: 'var(--dx-on-secondary-container)' }}
                    >
                      🏢 Biznesga o‘tish →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      {!selectedShop && (
        <div
          className="border-t px-2 py-2 grid grid-cols-4 gap-1"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          {(
            [
              { id: 'home', label: 'Bosh sahifa', Icon: ShoppingBag },
              { id: 'shops', label: "Do'konlar", Icon: Store },
              { id: 'orders', label: `Buyurtmalar (${activeOrders.length})`, Icon: Clock },
              { id: 'profile', label: 'Siz', Icon: User },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="py-2 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'var(--dx-primary-container)' : 'transparent',
                  color: active ? 'var(--dx-on-primary-container)' : 'var(--dx-muted)',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate max-w-full px-1">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && !checkoutProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl max-h-[90vh] flex flex-col"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="relative h-56 shrink-0">
              <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute top-3 left-3 flex gap-2">
                {selectedProduct.status === 'hot_ready' && (
                  <span
                    className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--dx-tertiary-container)', color: 'var(--dx-on-tertiary-container)' }}
                  >
                    ● Hozir mavjud
                  </span>
                )}
                {isDiscountActive(selectedProduct) && (
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#BA1A1A] text-white">
                    -{selectedProduct.discountPercent}%
                  </span>
                )}
              </div>
              {selectedProduct.stock !== null && selectedProduct.stock <= 5 && selectedProduct.stock > 0 && (
                <span
                  className="absolute bottom-3 right-3 text-xs font-extrabold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: 'var(--dx-error-container)', color: 'var(--dx-on-error-container)' }}
                >
                  Faqat {selectedProduct.stock} ta qoldi!
                </span>
              )}
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <h3 className="font-display text-2xl font-bold">{selectedProduct.name}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShopId(selectedProduct.businessId);
                    setSelectedProduct(null);
                  }}
                  className="text-sm font-bold mt-0.5 hover:underline cursor-pointer"
                  style={{ color: 'var(--dx-secondary)' }}
                >
                  🏪 {selectedProduct.businessName} →
                </button>
              </div>

              <div
                className="p-4 rounded-2xl flex items-center justify-between"
                style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
              >
                <div>
                  {isDiscountActive(selectedProduct) && (
                    <div className="text-xs line-through opacity-70">{formatSoM(selectedProduct.price)}</div>
                  )}
                  <div className="text-2xl font-extrabold">{formatSoM(getEffectivePrice(selectedProduct))}</div>
                </div>
                {selectedProduct.stock !== null && (
                  <div className="text-xs font-bold">Zaxira: {selectedProduct.stock} ta</div>
                )}
              </div>

              <p className="text-sm leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
                {selectedProduct.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${selectedProduct.businessPhone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold"
                  style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-text)' }}
                >
                  <Phone className="w-3.5 h-3.5" /> Qo‘ng‘iroq
                </a>
                <a
                  href="https://t.me/dasturxon_uz"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold"
                  style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-secondary)' }}
                >
                  <Send className="w-3.5 h-3.5" /> Telegram
                </a>
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--dx-border)' }}>
              <div className="font-extrabold text-lg" style={{ color: 'var(--dx-primary)' }}>
                {formatSoM(getEffectivePrice(selectedProduct))}
              </div>
              <button
                type="button"
                disabled={selectedProduct.status === 'sold_out' || selectedProduct.stock === 0}
                onClick={() => openCheckout(selectedProduct)}
                className="px-6 py-3 rounded-2xl text-sm font-bold disabled:opacity-45 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                {selectedProduct.status === 'sold_out' || selectedProduct.stock === 0
                  ? 'Tugagan'
                  : 'Buyurtma berish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (CheckoutSheet.kt) */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">Buyurtma berish</h3>
              <button type="button" onClick={() => setCheckoutProduct(null)} className="p-1.5 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="p-3.5 rounded-2xl flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--dx-surface-variant)' }}>
              <div>
                <div className="font-bold text-sm">{checkoutProduct.name}</div>
                <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>{checkoutProduct.businessName}</div>
              </div>
              <div className="text-right">
                {isDiscountActive(checkoutProduct) && (
                  <div className="text-[11px] line-through opacity-60">{formatSoM(checkoutProduct.price)}</div>
                )}
                <div className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
                  {formatSoM(getEffectivePrice(checkoutProduct))}
                </div>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">Miqdor</div>
                {checkoutProduct.stock !== null && (
                  <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
                    Mavjud: {checkoutProduct.stock} ta
                  </div>
                )}
              </div>
              <div className="inline-flex items-center gap-3 rounded-xl border p-1" style={{ borderColor: 'var(--dx-border)' }}>
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1.5 rounded-lg hover:opacity-80 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-sm min-w-[24px] text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQty(Math.min(checkoutProduct.stock ?? 99, 99, qty + 1))
                  }
                  className="p-1.5 rounded-lg hover:opacity-80 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fulfillment */}
            <div className="space-y-2">
              <div className="text-xs font-bold">Qabul qilish usuli (yetkazish bepul)</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillment('pickup')}
                  className="p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: fulfillment === 'pickup' ? 'var(--dx-primary-container)' : 'var(--dx-bg)',
                    borderColor: fulfillment === 'pickup' ? 'var(--dx-primary)' : 'var(--dx-border)',
                  }}
                >
                  <ShoppingBag className="w-4 h-4" /> Olib ketish
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillment('delivery')}
                  className="p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: fulfillment === 'delivery' ? 'var(--dx-primary-container)' : 'var(--dx-bg)',
                    borderColor: fulfillment === 'delivery' ? 'var(--dx-primary)' : 'var(--dx-border)',
                  }}
                >
                  <Truck className="w-4 h-4" /> Yetkazib berish
                </button>
              </div>

              {fulfillment === 'delivery' && (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Yunusobod tumani, 4-mavze, 12-uy, 15-xonadon"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                    style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                  />
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                    style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                  />
                </div>
              )}
            </div>

            {/* Pickup Time Presets */}
            <div className="space-y-2">
              <div className="text-xs font-bold">
                {fulfillment === 'delivery' ? 'Yetkazish vaqti' : 'Olib ketish vaqti'}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    ['30m', '30 daqiqa'],
                    ['1h', '1 soat'],
                    ['2h', '2 soat'],
                    ['18h', 'Bugun 18:00'],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPickupPreset(k)}
                    className="py-2 px-1.5 rounded-xl border text-[11px] font-bold cursor-pointer"
                    style={{
                      backgroundColor: pickupPreset === k ? 'var(--dx-secondary-container)' : 'var(--dx-bg)',
                      borderColor: pickupPreset === k ? 'var(--dx-secondary)' : 'var(--dx-border)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {checkoutErr && (
              <div
                className="p-3 rounded-xl text-xs font-bold"
                style={{ backgroundColor: 'var(--dx-error-container)', color: 'var(--dx-on-error-container)' }}
              >
                {checkoutErr}
              </div>
            )}

            {/* Total */}
            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--dx-border)' }}>
              <div>
                <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>Jami to‘lov (joyida)</div>
                <div className="text-xl font-extrabold" style={{ color: 'var(--dx-primary)' }}>
                  {formatSoM(getEffectivePrice(checkoutProduct) * qty)}
                </div>
              </div>
              <button
                type="button"
                onClick={submitCheckout}
                className="px-5 py-3 rounded-2xl text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                <Check className="w-4 h-4" /> Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Subcomponents inside CustomerWorkspace ─────────────────────────────── */

interface ProductCardItemProps {
  product: Product;
  onCardClick: () => void;
  onOrderClick: () => void;
}

const ProductCardItem: React.FC<ProductCardItemProps> = ({
  product,
  onCardClick,
  onOrderClick,
}) => {
  const effectivePrice = getEffectivePrice(product);
  const discountActive = isDiscountActive(product);
  const soldOut = product.status === 'sold_out' || product.stock === 0;

  return (
    <div
      onClick={onCardClick}
      className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div>
        <div className="relative aspect-[16/10] bg-stone-200">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          {product.status === 'hot_ready' && !soldOut && (
            <span
              className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm"
              style={{ backgroundColor: 'var(--dx-tertiary-container)', color: 'var(--dx-on-tertiary-container)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-live-dot" style={{ backgroundColor: 'var(--dx-tertiary)' }} />
              Issiq tayyor
            </span>
          )}
          {discountActive && (
            <span className="absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-[#BA1A1A] text-white">
              -{product.discountPercent}%
            </span>
          )}
          {soldOut && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-white text-stone-900">
                Tugagan
              </span>
            </div>
          )}
        </div>

        <div className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--dx-muted)' }}>
            <span className="truncate font-semibold">{product.businessName}</span>
            {product.stock !== null && !soldOut && (
              <span className="shrink-0">Zaxira: {product.stock} ta</span>
            )}
          </div>
          <h4 className="font-bold text-sm leading-snug truncate" style={{ color: 'var(--dx-text)' }}>
            {product.name}
          </h4>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
            {product.description}
          </p>
        </div>
      </div>

      <div className="px-3.5 pb-3.5 pt-1 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-extrabold" style={{ color: 'var(--dx-primary)' }}>
            {formatSoM(effectivePrice)}
          </div>
          {discountActive && (
            <div className="text-[11px] line-through" style={{ color: 'var(--dx-muted)' }}>
              {formatSoM(product.price)}
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={(e) => {
            e.stopPropagation();
            onOrderClick();
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          Buyurtma
        </button>
      </div>
    </div>
  );
};

interface ShopDetailPanelProps {
  shop: Business;
  products: Product[];
  onProductClick: (p: Product) => void;
  onOrderClick: (p: Product) => void;
  onSeeAllProducts: () => void;
}

const ShopDetailPanel: React.FC<ShopDetailPanelProps> = ({
  shop,
  products,
  onProductClick,
  onOrderClick,
  onSeeAllProducts,
}) => {
  const hotCount = products.filter((p) => p.status === 'hot_ready').length;
  const bt = BUSINESS_TYPES.find((t) => t.storedValue === shop.type);

  return (
    <div className="space-y-6">
      <div
        className="rounded-3xl p-6 border text-center space-y-3"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl font-extrabold"
          style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
        >
          {shop.name.slice(0, 1)}
        </div>
        <h3 className="font-display text-2xl font-bold">{shop.name}</h3>
        <span
          className="inline-block text-xs font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: 'var(--dx-secondary-container)', color: 'var(--dx-on-secondary-container)' }}
        >
          {bt?.icon} {bt?.labelUz ?? 'Boshqa'}
        </span>

        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-3 border-t" style={{ borderColor: 'var(--dx-border)' }}>
          <div>
            <div className="text-lg font-extrabold">{products.length}</div>
            <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>Mahsulot</div>
          </div>
          <div>
            <div className="text-lg font-extrabold" style={{ color: 'var(--dx-tertiary)' }}>{hotCount}</div>
            <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>Hozir mavjud</div>
          </div>
          <div>
            <div className="text-lg font-extrabold" style={{ color: 'var(--dx-primary)' }}>✓</div>
            <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>Tasdiqlangan</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onSeeAllProducts}
            className="px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            Mahsulotlarni lentada ko‘rish
          </button>
          <a
            href={`tel:${shop.phone.replace(/\s+/g, '')}`}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5"
            style={{ borderColor: 'var(--dx-border)' }}
          >
            <Phone className="w-3.5 h-3.5" /> {shop.phone}
          </a>
        </div>
      </div>

      {shop.typeNote && (
        <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
          <div className="text-xs font-bold mb-1">Haqida</div>
          <p className="text-sm" style={{ color: 'var(--dx-muted)' }}>{shop.typeNote}</p>
        </div>
      )}

      {/* OLX-Style Yunusobod Map Card (ShopDetailScreen.kt) */}
      <div className="p-5 rounded-3xl border space-y-3" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm flex items-center gap-1.5">
            <MapPin className="w-4 h-4" style={{ color: 'var(--dx-primary)' }} />
            Joylashuv: {shop.address}
          </div>
        </div>
        <div className="relative h-44 rounded-2xl overflow-hidden bg-[#DDE6D8] flex items-center justify-center">
          <svg viewBox="0 0 600 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <rect width="600" height="200" fill="#DDE6D8" />
            <rect x="60" y="28" width="190" height="86" rx="14" fill="#CCE0C6" />
            <path d="M0 170 Q 200 185 360 140 T 600 150" stroke="#B5D5E6" strokeWidth="18" fill="none" />
            <rect x="0" y="68" width="600" height="20" fill="#F7FAF4" />
            <rect x="305" y="0" width="28" height="200" fill="#FFFFFF" />
            <rect x="0" y="122" width="600" height="26" fill="#FFFFFF" />
            <circle cx="319" cy="94" r="42" fill="rgba(183, 80, 10, 0.20)" />
            <circle cx="319" cy="94" r="7" fill="#B7500A" />
          </svg>
          <div
            className="relative z-10 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg -translate-y-6"
            style={{ backgroundColor: '#B7500A', color: '#FFFFFF' }}
          >
            📍 {shop.name}
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-base">Do‘kon mahsulotlari ({products.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCardItem
                key={p.id}
                product={p}
                onCardClick={() => onProductClick(p)}
                onOrderClick={() => onOrderClick(p)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
