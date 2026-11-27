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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    className="p-5 sm:p-6 rounded-3xl border text-white space-y-4"
    style={{
      background: 'linear-gradient(135deg, #0D3B3E 0%, #14535B 60%, #1C6C75 100%)',
      borderColor: '#1E7E88',
    }}
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 font-display text-2xl sm:text-3xl font-extrabold">
          <Boxes className="w-6 h-6 text-[#93F2DC]" />
          <span>Optom Bozor · B2B Partiyalar</span>
        </div>
        <p className="text-xs sm:text-sm text-white/85">
          To‘ylar, ofislar va mahalla do‘konlari uchun bevosita sex narxida katta partiyalar (
          {count} ta maxsus ulgurji taklif)
        </p>
      </div>
      <Link
        to="/feed"
        className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Oddiy vitrinaga qaytish
      </Link>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
      <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15">
        <span className="font-extrabold text-[#93F2DC]">📦 Partiya hajmi:</span>{' '}
        <span className="text-white/90">5 tadan 10 000 tagacha</span>
      </div>
      <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15">
        <span className="font-extrabold text-[#93F2DC]">💸 Sex narxi:</span>{' '}
        <span className="text-white/90">Chakanadan 23%–46% arzon</span>
      </div>
      <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15">
        <span className="font-extrabold text-[#93F2DC]">🛡️ Himoya:</span>{' '}
        <span className="text-white/90">50% avans cheki bilan tasdiqlash</span>
      </div>
    </div>
  </div>
);

const WholesaleSkeletons: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {[1, 2, 3, 4].map((k) => (
      <div
        key={k}
        className="h-52 rounded-2xl border animate-pulse"
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
