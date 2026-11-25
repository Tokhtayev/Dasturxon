import React from 'react';
import { ArrowUpRight, MapPin, Phone, Star } from 'lucide-react';
import type { Business, Product } from '../types/dasturxon';
import type { Translations } from '../i18n/translations';
import { formatSoM, getEffectivePrice } from '../utils/analytics';
import { BUSINESS_TYPES } from '../data/demoData';

interface PriceCompareAndMapProps {
  t: Translations;
  businesses: Business[];
  products: Product[];
  onSelectShop: (businessId: string) => void;
}

export const PriceCompareAndMap: React.FC<PriceCompareAndMapProps> = ({
  t,
  businesses,
  products,
  onSelectShop,
}) => {
  const approvedShops = businesses.filter((b) => b.status === 'approved');

  const findProduct = (id: string) => products.find((p) => p.id === id);

  const comparisonGroups = [
    {
      item: 'Tandir non (klassik, 350 g)',
      category: '🥖 Nonvoyxona',
      image: './images/food_tandir_non.jpg',
      offerIds: [
        { id: 'demo_prod_tandir_non', label: 'Baraka novvoyxonasi', location: '4-mavze' },
        { id: 'demo_prod_tandir_non_nonvoy', label: 'Yunusobod Nonvoy Markazi', location: '11-mavze' },
      ],
    },
    {
      item: 'Tandir Somsa turlari',
      category: '🍰 Pishiriq',
      image: './images/food_somsa.jpg',
      offerIds: [
        { id: 'demo_prod_qovoqli_somsa', label: 'Baraka (Qovoqli)', location: '4-mavze' },
        { id: 'demo_prod_goshtli_somsa', label: "Baraka (Go'shtli)", location: '4-mavze' },
        { id: 'demo_prod_bodomzor_somsa', label: 'Bodomzor Somsa & Tandir', location: 'Bodomzor metro' },
      ],
    },
    {
      item: 'Issiq Palov porsiyasi',
      category: '🍲 Oshxona',
      image: './images/food_plov.jpg',
      offerIds: [
        { id: 'demo_prod_toy_oshi', label: "Yunusobod To'y Oshi", location: 'Shahriston, 42' },
        { id: 'demo_prod_chust_palov', label: 'Chust Choyxona Palovi', location: 'Shahriston, 42' },
      ],
    },
  ];

  return (
    <section id="compare" className="py-16 sm:py-20 border-t" style={{ borderColor: 'var(--dx-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: 'var(--dx-secondary)' }}>
            {t.compareEyebrow}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--dx-text)' }}>
            {t.compareTitle}
          </h2>
          <p className="text-base" style={{ color: 'var(--dx-muted)' }}>
            {t.compareSubtitle}
          </p>
        </div>

        {/* Price Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisonGroups.map((group) => {
            const resolvedOffers = group.offerIds
              .map((ref) => {
                const prod = findProduct(ref.id);
                if (!prod) return null;
                return {
                  ...ref,
                  price: getEffectivePrice(prod),
                  stock: prod.stock ?? 0,
                };
              })
              .filter((o): o is NonNullable<typeof o> => o !== null);
            const lowestPrice = Math.min(...resolvedOffers.map((o) => o.price));

            return (
              <div
                key={group.item}
                className="rounded-3xl overflow-hidden border flex flex-col"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              >
                <div className="relative h-40">
                  <img src={group.image} alt={group.item} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm">
                      {group.category}
                    </span>
                    <h3 className="text-lg font-extrabold mt-1">{group.item}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-2.5 flex-1">
                  {resolvedOffers.map((offer) => {
                    const best = offer.price === lowestPrice;
                    return (
                      <div
                        key={offer.id}
                        className="p-3 rounded-2xl border flex items-center justify-between gap-2"
                        style={{
                          backgroundColor: best ? 'var(--dx-tertiary-container)' : 'var(--dx-bg)',
                          borderColor: best
                            ? 'color-mix(in srgb, var(--dx-tertiary) 35%, transparent)'
                            : 'var(--dx-border)',
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-sm font-bold truncate"
                              style={{ color: best ? 'var(--dx-on-tertiary-container)' : 'var(--dx-text)' }}
                            >
                              {offer.label}
                            </span>
                            {best && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/10">
                                Eng arzon
                              </span>
                            )}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: best ? 'var(--dx-on-tertiary-container)' : 'var(--dx-muted)' }}
                          >
                            {offer.location} · Zaxira: {offer.stock} ta
                          </div>
                        </div>
                        <div
                          className="text-sm font-extrabold whitespace-nowrap"
                          style={{ color: best ? 'var(--dx-on-tertiary-container)' : 'var(--dx-primary)' }}
                        >
                          {formatSoM(offer.price)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Yunusobod Approved Shops Directory */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold" style={{ color: 'var(--dx-text)' }}>
                Yunusoboddagi tasdiqlangan do‘konlar ({approvedShops.length})
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--dx-muted)' }}>
                Istalgan biznesni tanlang va uning jonli menyusi hamda mahalla xaritasini oching.
              </p>
            </div>
            <a
              href="#live-app"
              className="text-sm font-bold inline-flex items-center gap-1"
              style={{ color: 'var(--dx-primary)' }}
            >
              Barchasini ilovada ko‘rish <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedShops.map((shop) => {
              const meta = BUSINESS_TYPES.find((bt) => bt.storedValue === shop.type);
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => onSelectShop(shop.id)}
                  className="text-left rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--dx-surface)',
                    borderColor: 'var(--dx-border)',
                  }}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-extrabold shrink-0"
                          style={{
                            backgroundColor: 'var(--dx-primary-container)',
                            color: 'var(--dx-on-primary-container)',
                          }}
                        >
                          {shop.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-base leading-snug" style={{ color: 'var(--dx-text)' }}>
                            {shop.name}
                          </div>
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mt-1"
                            style={{
                              backgroundColor: 'var(--dx-secondary-container)',
                              color: 'var(--dx-on-secondary-container)',
                            }}
                          >
                            {meta?.icon} {meta?.labelUz ?? 'Boshqa'}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" /> 4.8+
                      </span>
                    </div>

                    {shop.typeNote && (
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--dx-muted)' }}>
                        {shop.typeNote}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t space-y-1.5 text-xs" style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-muted)' }}>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--dx-primary)' }} />
                      <span className="truncate">{shop.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--dx-secondary)' }} />
                        {shop.phone}
                      </span>
                      <span className="font-bold" style={{ color: 'var(--dx-primary)' }}>
                        Ochish →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
