import React from 'react';
import { MapPin, Store } from 'lucide-react';
import { formatSoM, getEffectivePrice, isDiscountActive } from '../../services/analytics';
import { BUSINESS_TYPE_VISUALS } from '../../services/constants';
import type { Product } from '../../types/domain';

interface ProductFeedCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onOrder: (product: Product) => void;
}

export const ProductFeedCard: React.FC<ProductFeedCardProps> = ({ product, onSelect, onOrder }) => {
  const effectivePrice = getEffectivePrice(product);
  const discountActive = isDiscountActive(product);
  const soldOut = product.status === 'sold_out' || (product.stock !== null && product.stock <= 0);
  const visual =
    BUSINESS_TYPE_VISUALS[product.category || product.businessType] ?? BUSINESS_TYPE_VISUALS.other;

  return (
    <div
      onClick={() => onSelect(product)}
      className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div>
        <div
          className="relative h-36 flex items-center justify-center"
          style={{ background: visual.gradient }}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl drop-shadow-md select-none">{visual.icon}</span>
          )}
          {product.status === 'hot_ready' && !soldOut && (
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
              -{product.discountPercent}%
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
          <div
            className="flex items-center justify-between gap-2 text-[11px]"
            style={{ color: 'var(--dx-muted)' }}
          >
            <span className="font-bold truncate inline-flex items-center gap-1">
              <Store className="w-3 h-3" /> {product.businessName}
            </span>
            {product.stock !== null && !soldOut && <span>Zaxira: {product.stock} ta</span>}
          </div>
          <h3 className="font-bold text-base truncate">{product.name}</h3>
          {product.businessAddress && (
            <div
              className="text-[11px] truncate inline-flex items-center gap-1 max-w-full"
              style={{ color: 'var(--dx-muted)' }}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{product.businessAddress}</span>
            </div>
          )}
          {product.description && (
            <p className="text-xs line-clamp-2" style={{ color: 'var(--dx-muted)' }}>
              {product.description}
            </p>
          )}
          {product.wholesaleEnabled && product.wholesaleMinQty && product.wholesalePrice && (
            <div
              className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-lg"
              style={{
                backgroundColor: 'var(--dx-secondary-container)',
                color: 'var(--dx-on-secondary-container)',
              }}
            >
              📦 Optom ({product.wholesaleMinQty}+): {formatSoM(product.wholesalePrice)}
            </div>
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
              {formatSoM(product.price)}
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={(e) => {
            e.stopPropagation();
            onOrder(product);
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          Buyurtma
        </button>
      </div>
    </div>
  );
};
