import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, Minus, Phone, Plus, Search, ShoppingBag, Store, Truck, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerFeed } from '../../hooks/useCustomerFeed';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { formatSoM, getEffectivePrice, isDiscountActive } from '../../services/analytics';
import { BUSINESS_TYPES, type BusinessTypeKey, type FulfillmentType, type Product } from '../../types/domain';

const TYPE_VISUAL: Record<BusinessTypeKey, { icon: string; gradient: string }> = {
  bakery: { icon: '🥖', gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)' },
  confectionery: { icon: '🍬', gradient: 'linear-gradient(135deg, #6B1736 0%, #B8426B 100%)' },
  pastry: { icon: '🍰', gradient: 'linear-gradient(135deg, #7A3803 0%, #C66D28 100%)' },
  teahouse: { icon: '🍵', gradient: 'linear-gradient(135deg, #0F7C84 0%, #3E9BA2 100%)' },
  kitchen: { icon: '🍲', gradient: 'linear-gradient(135deg, #1E3A2F 0%, #4C7A2B 100%)' },
  cafe: { icon: '☕', gradient: 'linear-gradient(135deg, #4E342E 0%, #8D6E63 100%)' },
  other: { icon: '🍽️', gradient: 'linear-gradient(135deg, #5D4037 0%, #B7500A 100%)' },
};

export const CustomerFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const uid = session.status === 'ready' ? session.profile.uid : undefined;
  const userFullName = session.status === 'ready' ? session.profile.fullName : '';
  const userPhone = session.status === 'ready' ? session.profile.phone : '';

  const {
    businesses,
    businessById,
    filteredProducts,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  } = useCustomerFeed(Boolean(uid));

  const { placeOrder } = useCustomerOrders(uid);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  // Checkout state
  const [qty, setQty] = useState(1);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(userPhone);
  const [pickupPreset, setPickupPreset] = useState<'30m' | '1h' | '2h'>('1h');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const openCheckout = (product: Product) => {
    setCheckoutProduct(product);
    setQty(1);
    setFulfillment('pickup');
    setContactPhone(userPhone || '+998 ');
    setCheckoutError(null);
  };

  const getPickupMillis = () => {
    const now = Date.now();
    if (pickupPreset === '30m') return now + 30 * 60 * 1000;
    if (pickupPreset === '2h') return now + 2 * 60 * 60 * 1000;
    return now + 60 * 60 * 1000;
  };

  const handleConfirmOrder = async () => {
    if (!checkoutProduct) return;
    setCheckoutError(null);

    if (checkoutProduct.stock !== null && qty > checkoutProduct.stock) {
      setCheckoutError(`Zaxira yetarli emas (${checkoutProduct.stock} ta mavjud).`);
      return;
    }
    if (fulfillment === 'delivery' && (!deliveryAddress.trim() || contactPhone.trim().length < 7)) {
      setCheckoutError('Yetkazib berish uchun manzil va telefon raqamini kiriting.');
      return;
    }

    const business = businessById.get(checkoutProduct.businessId);
    if (!business) {
      setCheckoutError('Biznes tasdiqlanmagan yoki topilmadi.');
      return;
    }

    setSubmitting(true);
    try {
      await placeOrder({
        customerName: userFullName || 'Xaridor',
        customerPhone: contactPhone.trim(),
        business,
        product: checkoutProduct,
        quantity: qty,
        pickupTimeMs: getPickupMillis(),
        fulfillmentType: fulfillment,
        deliveryAddress: deliveryAddress.trim(),
      });
      setCheckoutProduct(null);
      setSelectedProduct(null);
      navigate('/customer/orders');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Buyurtma yaratilmadi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Mahalla Bozori</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--dx-muted)' }}>
            Tasdiqlangan mahalliy bizneslar: {businesses.length} ta · Jonli mahsulotlar
          </p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--dx-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mahsulot yoki do‘kon qidirish…"
            className="w-full pl-10 pr-10 py-3 rounded-2xl border text-sm focus:outline-none"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
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

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer"
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

      {error && (
        <div
          className="p-3.5 rounded-2xl text-xs font-bold"
          style={{ backgroundColor: 'var(--dx-error-container)', color: 'var(--dx-on-error-container)' }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="h-64 rounded-2xl border animate-pulse"
              style={{ backgroundColor: 'var(--dx-surface-variant)', borderColor: 'var(--dx-border)' }}
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center border space-y-2"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="text-3xl">🥖</div>
          <div className="font-bold text-base">Hozircha mahsulotlar mavjud emas</div>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--dx-muted)' }}>
            Tasdiqlangan bizneslar mahsulot qo‘shishi bilan bu yerda jonli ko‘rinadi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const effectivePrice = getEffectivePrice(p);
            const discountActive = isDiscountActive(p);
            const soldOut = p.status === 'sold_out' || p.stock === 0;
            const visual = TYPE_VISUAL[p.businessType] ?? TYPE_VISUAL.other;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              >
                <div>
                  <div
                    className="relative h-36 flex items-center justify-center"
                    style={{ background: visual.gradient }}
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl drop-shadow-md select-none">{visual.icon}</span>
                    )}

                    {p.status === 'hot_ready' && !soldOut && (
                      <span
                        className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--dx-tertiary-container)',
                          color: 'var(--dx-on-tertiary-container)',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-live-dot"
                          style={{ backgroundColor: 'var(--dx-tertiary)' }}
                        />
                        Hozir mavjud
                      </span>
                    )}
                    {discountActive && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-[#BA1A1A] text-white">
                        -{p.discountPercent}%
                      </span>
                    )}
                    {soldOut && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-white text-stone-900">
                          Tugagan
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--dx-muted)' }}>
                      <span className="font-bold truncate inline-flex items-center gap-1">
                        <Store className="w-3 h-3" /> {p.businessName}
                      </span>
                      {p.stock !== null && !soldOut && <span>Zaxira: {p.stock} ta</span>}
                    </div>
                    <h3 className="font-bold text-base truncate">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs line-clamp-2" style={{ color: 'var(--dx-muted)' }}>
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
                      {formatSoM(effectivePrice)}
                    </div>
                    {discountActive && (
                      <div className="text-[11px] line-through" style={{ color: 'var(--dx-muted)' }}>
                        {formatSoM(p.price)}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCheckout(p);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
                    style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                  >
                    Buyurtma
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && !checkoutProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden border shadow-2xl"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div
              className="relative h-44 flex items-center justify-center"
              style={{
                background: (TYPE_VISUAL[selectedProduct.businessType] ?? TYPE_VISUAL.other).gradient,
              }}
            >
              <span className="text-6xl">
                {(TYPE_VISUAL[selectedProduct.businessType] ?? TYPE_VISUAL.other).icon}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/45 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">{selectedProduct.name}</h2>
                <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--dx-secondary)' }}>
                  🏪 {selectedProduct.businessName}
                </p>
              </div>
              <div
                className="p-3.5 rounded-2xl flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--dx-primary-container)',
                  color: 'var(--dx-on-primary-container)',
                }}
              >
                <div>
                  {isDiscountActive(selectedProduct) && (
                    <div className="text-xs line-through opacity-75">
                      {formatSoM(selectedProduct.price)}
                    </div>
                  )}
                  <div className="text-xl font-extrabold">
                    {formatSoM(getEffectivePrice(selectedProduct))}
                  </div>
                </div>
                {selectedProduct.stock !== null && (
                  <span className="text-xs font-bold">Zaxira: {selectedProduct.stock} ta</span>
                )}
              </div>
              {selectedProduct.description && (
                <p className="text-sm" style={{ color: 'var(--dx-muted)' }}>
                  {selectedProduct.description}
                </p>
              )}
              <div className="text-xs space-y-1" style={{ color: 'var(--dx-muted)' }}>
                {selectedProduct.businessAddress && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {selectedProduct.businessAddress}
                  </div>
                )}
                {selectedProduct.businessPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {selectedProduct.businessPhone}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={selectedProduct.status === 'sold_out' || selectedProduct.stock === 0}
                onClick={() => openCheckout(selectedProduct)}
                className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-45 cursor-pointer"
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

      {/* Checkout Modal */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Buyurtma berish</h2>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setCheckoutProduct(null)}
                className="p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-3.5 rounded-2xl flex items-center justify-between"
              style={{ backgroundColor: 'var(--dx-surface-variant)' }}
            >
              <div>
                <div className="font-bold text-sm">{checkoutProduct.name}</div>
                <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
                  {checkoutProduct.businessName}
                </div>
              </div>
              <div className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
                {formatSoM(getEffectivePrice(checkoutProduct))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">Miqdor</div>
                {checkoutProduct.stock !== null && (
                  <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
                    Mavjud: {checkoutProduct.stock} ta
                  </div>
                )}
              </div>
              <div
                className="inline-flex items-center gap-3 rounded-xl border p-1"
                style={{ borderColor: 'var(--dx-border)' }}
              >
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1.5 cursor-pointer"
                  aria-label="Kamaytirish"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-sm min-w-[20px] text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(checkoutProduct.stock ?? 99, 99, qty + 1))}
                  className="p-1.5 cursor-pointer"
                  aria-label="Oshirish"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pickup vs Delivery */}
            <div className="space-y-2">
              <div className="text-xs font-bold">Qabul qilish usuli</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillment('pickup')}
                  className="p-2.5 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor:
                      fulfillment === 'pickup' ? 'var(--dx-primary-container)' : 'var(--dx-bg)',
                    borderColor: fulfillment === 'pickup' ? 'var(--dx-primary)' : 'var(--dx-border)',
                  }}
                >
                  <ShoppingBag className="w-4 h-4" /> Olib ketish
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillment('delivery')}
                  className="p-2.5 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor:
                      fulfillment === 'delivery' ? 'var(--dx-primary-container)' : 'var(--dx-bg)',
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
                    placeholder="Yetkazib berish manzili (Yunusobod 4-mavze...)"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                    style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                  />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Bog'lanish uchun telefon (+998 90...)"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                    style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                  />
                </div>
              )}
            </div>

            {/* Time presets */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold">
                {fulfillment === 'delivery' ? 'Yetkazish vaqti' : 'Olib ketish vaqti'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['30m', '30 daqiqa'],
                    ['1h', '1 soat'],
                    ['2h', '2 soat'],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPickupPreset(k)}
                    className="py-2 rounded-xl border text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor:
                        pickupPreset === k ? 'var(--dx-secondary-container)' : 'var(--dx-bg)',
                      borderColor: pickupPreset === k ? 'var(--dx-secondary)' : 'var(--dx-border)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {checkoutError && (
              <div
                className="p-3 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: 'var(--dx-error-container)',
                  color: 'var(--dx-on-error-container)',
                }}
              >
                {checkoutError}
              </div>
            )}

            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--dx-border)' }}>
              <div>
                <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
                  Jami (joyida to‘lov)
                </div>
                <div className="text-xl font-extrabold" style={{ color: 'var(--dx-primary)' }}>
                  {formatSoM(getEffectivePrice(checkoutProduct) * qty)}
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmOrder()}
                className="px-5 py-3 rounded-2xl text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                <Check className="w-4 h-4" /> {submitting ? 'Yuborilmoqda…' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
