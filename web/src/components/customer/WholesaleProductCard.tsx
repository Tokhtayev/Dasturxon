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
      className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col sm:flex-row"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <WholesaleCardMedia
        product={product}
        visual={visual}
        minQty={minQty}
        savingsPct={savingsPct}
        unavailable={unavailable}
      />

      <div className="p-4 flex-1 min-w-0 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div
            className="flex items-center justify-between gap-2 text-[11px]"
            style={{ color: 'var(--dx-muted)' }}
          >
            <span className="font-bold truncate inline-flex items-center gap-1">
              <Store className="w-3 h-3 shrink-0" /> {product.businessName}
            </span>
            {product.stock !== null && !unavailable && (
              <span
                className="font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: 'var(--dx-tertiary-container)',
                  color: 'var(--dx-on-tertiary-container)',
                }}
              >
                Ombor: {product.stock} ta
              </span>
            )}
          </div>

          <h3 className="font-display font-extrabold text-base leading-snug line-clamp-2">
            {product.name}
          </h3>

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
        </div>

        <WholesalePricingMatrix
          minQty={minQty}
          wholesalePrice={wholesalePrice}
          retailRefPrice={product.price}
          minBatchTotal={minBatchTotal}
        />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
            50% avans: <strong>{formatSoM(Math.ceil(minBatchTotal / 2))}</strong>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
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
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold disabled:opacity-45 cursor-pointer"
              style={{ backgroundColor: 'var(--dx-secondary)', color: '#FFFFFF' }}
            >
              Partiya buyurtma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WholesalePricingMatrix: React.FC<{
  minQty: number;
  wholesalePrice: number;
  retailRefPrice: number;
  minBatchTotal: number;
}> = ({ minQty, wholesalePrice, retailRefPrice, minBatchTotal }) => (
  <div
    className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border text-[11px]"
    style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
  >
    <div>
      <div style={{ color: 'var(--dx-muted)' }}>1 dona optom</div>
      <div className="font-extrabold text-xs" style={{ color: 'var(--dx-secondary)' }}>
        {formatSoM(wholesalePrice)}
      </div>
      {retailRefPrice > wholesalePrice && (
        <div className="text-[10px] line-through" style={{ color: 'var(--dx-muted)' }}>
          {formatSoM(retailRefPrice)}
        </div>
      )}
    </div>
    <div>
      <div style={{ color: 'var(--dx-muted)' }}>Min. partiya</div>
      <div className="font-extrabold text-xs">{minQty} dona</div>
      <div className="text-[10px]" style={{ color: 'var(--dx-muted)' }}>
        10 000 gacha
      </div>
    </div>
    <div>
      <div style={{ color: 'var(--dx-muted)' }}>Partiya jami</div>
      <div className="font-extrabold text-xs" style={{ color: 'var(--dx-primary)' }}>
        {formatSoM(minBatchTotal)}
      </div>
      <div className="text-[10px]" style={{ color: 'var(--dx-tertiary)' }}>
        50% avansli
      </div>
    </div>
  </div>
);

const WholesaleCardMedia: React.FC<{
  product: Product;
  visual: { icon: string; gradient: string };
  minQty: number;
  savingsPct: number;
  unavailable: boolean;
}> = ({ product, visual, minQty, savingsPct, unavailable }) => (
  <div
    className="relative h-40 sm:h-auto sm:w-44 shrink-0 flex items-center justify-center"
    style={{ background: visual.gradient }}
  >
    {product.imageUrl ? (
      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-5xl drop-shadow-md select-none">{visual.icon}</span>
    )}
    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-stone-900/80 text-white">
      <Boxes className="w-3 h-3" /> {minQty}+ ta
    </span>
    {savingsPct > 0 && (
      <span className="absolute bottom-2.5 left-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-[#0F7C84] text-white">
        -{savingsPct}% ulgurji
      </span>
    )}
    {unavailable && (
      <div className="absolute inset-0 bg-black/55 flex items-center justify-center px-3 text-center">
        <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-white text-stone-900">
          {product.status === 'sold_out'
            ? 'Partiya tugagan'
            : `Ombor ${product.stock} ta (min ${minQty})`}
        </span>
      </div>
    )}
  </div>
);
