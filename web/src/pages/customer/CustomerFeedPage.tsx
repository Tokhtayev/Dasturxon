import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { OrderCheckoutModal } from '../../components/customer/OrderCheckoutModal';
import { ProductDetailModal } from '../../components/customer/ProductDetailModal';
import { ProductFeedCard } from '../../components/customer/ProductFeedCard';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerFeed } from '../../hooks/useCustomerFeed';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import {
  BUSINESS_TYPES,
  type BusinessTypeKey,
  type FulfillmentType,
  type Product,
} from '../../types/domain';

export const CustomerFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
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

  const handleSubmitOrder = async (params: {
    quantity: number;
    pickupTimeMs: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
    contactPhone: string;
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
    });
    setCheckoutProduct(null);
    setSelectedProduct(null);
    navigate('/orders');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Mahalla Bozori</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--dx-muted)' }}>
          Tasdiqlangan mahalliy bizneslar: {businesses.length} ta · Jonli mahsulotlar
        </p>
      </div>

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
          products={filteredProducts}
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

interface FeedFilterControlsProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: 'all' | BusinessTypeKey;
  onCategoryChange: (val: 'all' | BusinessTypeKey) => void;
}

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

const FeedFilterControls: React.FC<FeedFilterControlsProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
}) => (
  <div className="space-y-3">
    <div className="relative">
      <Search
        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--dx-muted)' }}
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Mahsulot yoki do‘kon qidirish…"
        className="w-full pl-10 pr-10 py-3 rounded-2xl border text-sm focus:outline-none"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label="Qidiruvni tozalash"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        onClick={() => onCategoryChange('all')}
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
            onClick={() => onCategoryChange(bt.storedValue)}
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
);
