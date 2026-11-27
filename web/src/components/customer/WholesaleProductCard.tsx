import React from 'react';
import { Boxes, MapPin, PhoneCall, Store } from 'lucide-react';
import { formatSoM } from '../../services/analytics';
import { BUSINESS_TYPE_VISUALS } from '../../services/constants';
import { getWholesaleSavingsPercent } from '../../services/orderLogic';
import { buildTelHref, formatContactPhoneDisplay } from '../../services/validators';
import type { Product } from '../../types/domain';

interface WholesaleProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onOrderWholesale: (product: Product) => void;
}

export const WholesaleProductCard: React.FC<WholesaleProductCardProps> = ({
  product,
  onSelect,
  onOrderWholesale,
}) => {
  const minQty = product.wholesaleMinQty ?? 2;
  const wholesalePrice = product.wholesalePrice ?? product.price;
  const savingsPct = getWholesaleSavingsPercent(product);
  const insufficientStock = product.stock !== null && product.stock < minQty;
  const unavailable = product.status === 'sold_out' || insufficientStock;
  const minBatchTotal = minQty * wholesalePrice;
  const visual =
    BUSINESS_TYPE_VISUALS[product.category || product.businessType] ?? BUSINESS_TYPE_VISUALS.other;
  const cleanPhone = formatContactPhoneDisplay(product.businessPhone);

  return (
    <div
      onClick={() => onSelect(product)}
      className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div>
        <WholesaleCardCover
          product={product}
          visual={visual}
          minQty={minQty}
          savingsPct={savingsPct}
          unavailable={unavailable}
        />

        <div className="p-4 space-y-2">
          <div
            className="flex items-center justify-between gap-2 text-[11px]"
            style={{ color: 'var(--dx-muted)' }}
          >
            <span className="font-bold truncate inline-flex items-center gap-1">
              <Store className="w-3 h-3" /> {product.businessName}
            </span>
            {product.stock !== null && !unavailable && <span>Zaxira: {product.stock} ta</span>}
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

          <div
            className="p-2.5 rounded-xl text-xs space-y-0.5"
            style={{ backgroundColor: 'var(--dx-bg)' }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--dx-muted)' }}>Minimal partiya ({minQty} ta):</span>
              <span className="font-extrabold" style={{ color: 'var(--dx-primary)' }}>
                {formatSoM(minBatchTotal)}
              </span>
            </div>
            <div className="text-[11px]" style={{ color: 'var(--dx-tertiary)' }}>
              50% avans: {formatSoM(Math.ceil(minBatchTotal / 2))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
        <div>
          <div className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
            {formatSoM(wholesalePrice)} / dona
          </div>
          {product.price > wholesalePrice && (
            <div className="text-[11px] line-through" style={{ color: 'var(--dx-muted)' }}>
              {formatSoM(product.price)} oddiy
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {cleanPhone && (
            <a
              href={buildTelHref(cleanPhone)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Qo‘ng‘iroq qilish"
              className="p-2 rounded-xl border"
              style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-secondary)' }}
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            type="button"
            disabled={unavailable}
            onClick={(e) => {
              e.stopPropagation();
              onOrderWholesale(product);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-45 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            Optom olish
          </button>
        </div>
      </div>
    </div>
  );
};

const WholesaleCardCover: React.FC<{
  product: Product;
  visual: { icon: string; gradient: string };
  minQty: number;
  savingsPct: number;
  unavailable: boolean;
}> = ({ product, visual, minQty, savingsPct, unavailable }) => (
  <div
    className="relative h-36 flex items-center justify-center"
    style={{ background: visual.gradient }}
  >
    {product.imageUrl ? (
      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-5xl drop-shadow-md select-none">{visual.icon}</span>
    )}
    <span
      className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
      style={{
        backgroundColor: 'var(--dx-secondary-container)',
        color: 'var(--dx-on-secondary-container)',
      }}
    >
      <Boxes className="w-3 h-3" /> Min: {minQty} dona
    </span>
    {savingsPct > 0 && (
      <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-[#0F7C84] text-white">
        -{savingsPct}% optom
      </span>
    )}
    {unavailable && (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center px-3 text-center">
        <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-white text-stone-900">
          {product.status === 'sold_out' ? 'Tugagan' : `Zaxira ${product.stock} ta (min ${minQty})`}
        </span>
      </div>
    )}
  </div>
);
