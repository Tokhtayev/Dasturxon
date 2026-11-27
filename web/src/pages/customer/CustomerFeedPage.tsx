import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { FeedFilterControls } from '../../components/customer/FeedFilterControls';
import { OrderCheckoutModal } from '../../components/customer/OrderCheckoutModal';
import { ProductDetailModal } from '../../components/customer/ProductDetailModal';
import { ProductFeedCard } from '../../components/customer/ProductFeedCard';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerFeed } from '../../hooks/useCustomerFeed';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { isValidContactPhone } from '../../services/validators';
import type { FulfillmentType, OrderType, Product } from '../../types/domain';

export const CustomerFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, updatePhone } = useAuth();
  const profile = session.status === 'ready' ? session.profile : null;

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
  } = useCustomerFeed(Boolean(profile?.uid));
  const { placeOrder } = useCustomerOrders(profile?.uid);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  const retailProducts = useMemo(
    () => filteredProducts.filter((p) => !p.wholesaleOnly),
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
      orderType: params.orderType,
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
      <FeedHeroHeader businessCount={businesses.length} productCount={retailProducts.length} />

      <FeedFilterControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
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
        <FeedSkeletons />
      ) : (
        <FeedProductGrid
          products={retailProducts}
          onSelect={setSelectedProduct}
          onOrder={setCheckoutProduct}
        />
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
          defaultPhone={profile?.phone ?? ''}
          onClose={() => setCheckoutProduct(null)}
          onSubmitOrder={handleSubmitOrder}
        />
      )}
    </div>
  );
};

const FeedHeroHeader: React.FC<{ businessCount: number; productCount: number }> = ({
  businessCount,
  productCount,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Mahalla Bozori</h1>
      <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--dx-muted)' }}>
        Kundalik mahalliy vitrina · {businessCount} ta biznes, {productCount} ta chakana taom va non
      </p>
    </div>
    <Link
      to="/wholesale"
      className="px-3.5 py-2 rounded-xl border text-xs font-extrabold inline-flex items-center gap-1.5"
      style={{
        backgroundColor: 'var(--dx-secondary-container)',
        borderColor: 'var(--dx-secondary)',
        color: 'var(--dx-on-secondary-container)',
      }}
    >
      <Boxes className="w-4 h-4" /> Optom bozor →
    </Link>
  </div>
);

const FeedSkeletons: React.FC = () => (
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

const FeedProductGrid: React.FC<{
  products: Product[];
  onSelect: (p: Product) => void;
  onOrder: (p: Product) => void;
}> = ({ products, onSelect, onOrder }) =>
  products.length === 0 ? (
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
      {products.map((p) => (
        <ProductFeedCard key={p.id} product={p} onSelect={onSelect} onOrder={onOrder} />
      ))}
    </div>
  );
