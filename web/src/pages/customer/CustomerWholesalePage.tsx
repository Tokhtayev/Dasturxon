import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Boxes } from 'lucide-react';
import { FeedFilterControls } from '../../components/customer/FeedFilterControls';
import { OrderCheckoutModal } from '../../components/customer/OrderCheckoutModal';
import { ProductDetailModal } from '../../components/customer/ProductDetailModal';
import { WholesaleProductCard } from '../../components/customer/WholesaleProductCard';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerFeed } from '../../hooks/useCustomerFeed';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { isValidContactPhone } from '../../services/validators';
import type { FulfillmentType, OrderType, Product } from '../../types/domain';

export const CustomerWholesalePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, updatePhone } = useAuth();
  const profile = session.status === 'ready' ? session.profile : null;

  const {
    businessById,
    filteredProducts,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  } = useCustomerFeed(Boolean(profile?.uid));
  const { placeOrder } = useCustomerOrders(profile?.uid);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  const wholesaleProducts = useMemo(
    () =>
      filteredProducts.filter(
        (p) => p.wholesaleEnabled && p.wholesaleMinQty && p.wholesalePrice && p.wholesalePrice > 0
      ),
    [filteredProducts]
  );

  const handleSubmitOrder = async (params: {
    quantity: number;
    pickupTimeMs: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
    contactPhone: string;
    advanceReceiptUrl?: string;
    orderType?: OrderType;
  }) => {
    if (!checkoutProduct) return;
    const business = businessById.get(checkoutProduct.businessId);
    if (!business) throw new Error('Biznes tasdiqlanmagan yoki topilmadi.');

    await placeOrder({
      customerName: profile?.fullName || 'Xaridor',
      customerPhone: params.contactPhone,
      business,
      product: checkoutProduct,
      quantity: params.quantity,
      pickupTimeMs: params.pickupTimeMs,
      fulfillmentType: params.fulfillmentType,
      deliveryAddress: params.deliveryAddress,
      advanceReceiptUrl: params.advanceReceiptUrl,
      orderType: params.orderType ?? 'wholesale',
    });
    if (
      profile &&
      !isValidContactPhone(profile.phone) &&
      isValidContactPhone(params.contactPhone)
    ) {
      void updatePhone(params.contactPhone).catch(() => {});
    }
    setCheckoutProduct(null);
    setSelectedProduct(null);
    navigate('/orders');
  };

  return (
    <div className="space-y-6">
      <WholesaleHeroHeader count={wholesaleProducts.length} />

      <FeedFilterControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        placeholder="Optom non, qandolat yoki ishlab chiqaruvchi qidirish…"
      />

      {error && (
        <div
          className="p-3.5 rounded-2xl text-xs font-bold"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <WholesaleSkeletons />
      ) : wholesaleProducts.length === 0 ? (
        <WholesaleEmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wholesaleProducts.map((p) => (
            <WholesaleProductCard
              key={p.id}
              product={p}
              onSelect={setSelectedProduct}
              onOrderWholesale={setCheckoutProduct}
            />
          ))}
        </div>
      )}

      {selectedProduct && !checkoutProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOrder={setCheckoutProduct}
        />
      )}

      {checkoutProduct && (
        <OrderCheckoutModal
          product={checkoutProduct}
          initialOrderType="wholesale"
          defaultPhone={profile?.phone ?? ''}
          onClose={() => setCheckoutProduct(null)}
          onSubmitOrder={handleSubmitOrder}
        />
      )}
    </div>
  );
};

const WholesaleHeroHeader: React.FC<{ count: number }> = ({ count }) => (
  <div
    className="p-4 sm:p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-3"
    style={{
      backgroundColor: 'var(--dx-secondary-container)',
      borderColor: 'var(--dx-secondary)',
    }}
  >
    <div className="space-y-1">
      <div className="inline-flex items-center gap-2 font-display text-2xl sm:text-3xl font-extrabold">
        <Boxes className="w-6 h-6" style={{ color: 'var(--dx-secondary)' }} />
        <span>Optom Bozor</span>
      </div>
      <p className="text-xs sm:text-sm" style={{ color: 'var(--dx-muted)' }}>
        Katta partiyalar (masalan: 200 ta non × 2 700 so‘m) arzon narxda · 50% oldindan to‘lov
        kafolati bilan ({count} ta taklif)
      </p>
    </div>
    <Link
      to="/feed"
      className="px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Oddiy vitrina
    </Link>
  </div>
);

const WholesaleSkeletons: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3].map((k) => (
      <div
        key={k}
        className="h-64 rounded-2xl border animate-pulse"
        style={{ backgroundColor: 'var(--dx-surface-variant)', borderColor: 'var(--dx-border)' }}
      />
    ))}
  </div>
);

const WholesaleEmptyState: React.FC = () => (
  <div
    className="rounded-3xl p-10 text-center border space-y-2"
    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
  >
    <div className="text-3xl">📦</div>
    <div className="font-bold text-base">Hozircha optom mahsulotlar kiritilmagan</div>
    <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--dx-muted)' }}>
      Biznes egalari mahsulot qo‘shishda «Optom savdo»ni yoqishi bilan bu yerda katta partiyali
      arzon narxlar paydo bo‘ladi.
    </p>
  </div>
);
