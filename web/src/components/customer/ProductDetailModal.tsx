import React from 'react';
import { MapPin, Phone, X } from 'lucide-react';
import { formatSoM, getEffectivePrice, isDiscountActive } from '../../services/analytics';
import { BUSINESS_TYPE_VISUALS } from '../../services/constants';
import type { Product } from '../../types/domain';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onOrder: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOrder,
}) => {
  const visual =
    BUSINESS_TYPE_VISUALS[product.category || product.businessType] ?? BUSINESS_TYPE_VISUALS.other;
  const soldOut = product.status === 'sold_out' || (product.stock !== null && product.stock <= 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden border shadow-2xl"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div
          className="relative h-48 flex items-center justify-center"
          style={{ background: visual.gradient }}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">{visual.icon}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="absolute top-3 right-3 p-2 rounded-full bg-black/45 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold">{product.name}</h2>
            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--dx-secondary)' }}>
              🏪 {product.businessName}
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
              {isDiscountActive(product) && (
                <div className="text-xs line-through opacity-75">{formatSoM(product.price)}</div>
              )}
              <div className="text-xl font-extrabold">{formatSoM(getEffectivePrice(product))}</div>
            </div>
            {product.stock !== null && (
              <span className="text-xs font-bold">Zaxira: {product.stock} ta</span>
            )}
          </div>
          {product.description && (
            <p className="text-sm" style={{ color: 'var(--dx-muted)' }}>
              {product.description}
            </p>
          )}
          <div className="text-xs space-y-1" style={{ color: 'var(--dx-muted)' }}>
            {product.businessAddress && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {product.businessAddress}
              </div>
            )}
            {product.businessPhone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {product.businessPhone}
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onOrder(product)}
            className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-45 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            {soldOut ? 'Tugagan' : 'Buyurtma berish'}
          </button>
        </div>
      </div>
    </div>
  );
};
