import React, { useState } from 'react';
import { Check, Minus, Plus, ShoppingBag, Truck, X } from 'lucide-react';
import { formatSoM, getEffectivePrice } from '../../services/analytics';
import {
  MAX_ORDER_QUANTITY,
  MIN_ORDER_QUANTITY,
  MIN_PHONE_LENGTH,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
} from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import type { FulfillmentType, Product } from '../../types/domain';

type PickupPreset = '30m' | '1h' | '2h';

const PICKUP_MINUTES: Record<PickupPreset, number> = {
  '30m': 30,
  '1h': MINUTES_PER_HOUR,
  '2h': MINUTES_PER_HOUR * 2,
};

interface OrderCheckoutModalProps {
  product: Product;
  defaultPhone: string;
  onClose: () => void;
  onSubmitOrder: (params: {
    quantity: number;
    pickupTimeMs: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
    contactPhone: string;
  }) => Promise<void>;
}

export const OrderCheckoutModal: React.FC<OrderCheckoutModalProps> = ({
  product,
  defaultPhone,
  onClose,
  onSubmitOrder,
}) => {
  const [qty, setQty] = useState(MIN_ORDER_QUANTITY);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(defaultPhone || '+998 ');
  const [pickupPreset, setPickupPreset] = useState<PickupPreset>('1h');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const outOfStock =
    product.status === 'sold_out' || (product.stock !== null && product.stock <= 0);

  const handleConfirm = async () => {
    setCheckoutError(null);
    if (outOfStock) {
      setCheckoutError('Ushbu mahsulot tugagan.');
      return;
    }
    if (product.stock !== null && qty > product.stock) {
      setCheckoutError(`Zaxira yetarli emas (${product.stock} ta mavjud).`);
      return;
    }
    if (
      fulfillment === 'delivery' &&
      (!deliveryAddress.trim() || contactPhone.trim().length < MIN_PHONE_LENGTH)
    ) {
      setCheckoutError('Yetkazib berish uchun manzil va telefon raqamini kiriting.');
      return;
    }

    setSubmitting(true);
    try {
      const minutes = PICKUP_MINUTES[pickupPreset];
      await onSubmitOrder({
        quantity: qty,
        pickupTimeMs: Date.now() + minutes * MS_PER_MINUTE,
        fulfillmentType: fulfillment,
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
      });
    } catch (err) {
      setCheckoutError(getReadableErrorMessage(err, 'Buyurtma yaratilmadi.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            onClick={onClose}
            aria-label="Yopish"
            className="p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CheckoutProductHeader product={product} />
        <QuantitySelector qty={qty} stock={product.stock} onChange={setQty} />
        <FulfillmentFields
          fulfillment={fulfillment}
          onFulfillmentChange={setFulfillment}
          deliveryAddress={deliveryAddress}
          onAddressChange={setDeliveryAddress}
          contactPhone={contactPhone}
          onPhoneChange={setContactPhone}
          pickupPreset={pickupPreset}
          onPresetChange={setPickupPreset}
        />

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

        <div
          className="pt-3 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--dx-border)' }}
        >
          <div>
            <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
              Jami (joyida to‘lov)
            </div>
            <div className="text-xl font-extrabold" style={{ color: 'var(--dx-primary)' }}>
              {formatSoM(getEffectivePrice(product) * qty)}
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirm()}
            className="px-5 py-3 rounded-2xl text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
          >
            <Check className="w-4 h-4" /> {submitting ? 'Yuborilmoqda…' : 'Tasdiqlash'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CheckoutProductHeader: React.FC<{ product: Product }> = ({ product }) => (
  <div
    className="p-3.5 rounded-2xl flex items-center justify-between"
    style={{ backgroundColor: 'var(--dx-surface-variant)' }}
  >
    <div>
      <div className="font-bold text-sm">{product.name}</div>
      <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
        {product.businessName}
      </div>
    </div>
    <div className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
      {formatSoM(getEffectivePrice(product))}
    </div>
  </div>
);

const QuantitySelector: React.FC<{
  qty: number;
  stock: number | null;
  onChange: (next: number) => void;
}> = ({ qty, stock, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-xs font-bold">Miqdor</div>
      {stock !== null && (
        <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
          Mavjud: {stock} ta
        </div>
      )}
    </div>
    <div
      className="inline-flex items-center gap-3 rounded-xl border p-1"
      style={{ borderColor: 'var(--dx-border)' }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(MIN_ORDER_QUANTITY, qty - 1))}
        className="p-1.5 cursor-pointer"
        aria-label="Kamaytirish"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-extrabold text-sm min-w-[20px] text-center">{qty}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(stock ?? MAX_ORDER_QUANTITY, MAX_ORDER_QUANTITY, qty + 1))}
        className="p-1.5 cursor-pointer"
        aria-label="Oshirish"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const FulfillmentFields: React.FC<{
  fulfillment: FulfillmentType;
  onFulfillmentChange: (val: FulfillmentType) => void;
  deliveryAddress: string;
  onAddressChange: (val: string) => void;
  contactPhone: string;
  onPhoneChange: (val: string) => void;
  pickupPreset: PickupPreset;
  onPresetChange: (val: PickupPreset) => void;
}> = ({
  fulfillment,
  onFulfillmentChange,
  deliveryAddress,
  onAddressChange,
  contactPhone,
  onPhoneChange,
  pickupPreset,
  onPresetChange,
}) => (
  <>
    <div className="space-y-2">
      <div className="text-xs font-bold">Qabul qilish usuli</div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['pickup', 'Olib ketish', ShoppingBag],
            ['delivery', 'Yetkazib berish', Truck],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => onFulfillmentChange(key)}
            className="p-2.5 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: fulfillment === key ? 'var(--dx-primary-container)' : 'var(--dx-bg)',
              borderColor: fulfillment === key ? 'var(--dx-primary)' : 'var(--dx-border)',
            }}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {fulfillment === 'delivery' && (
        <div className="space-y-2 pt-1">
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Yetkazib berish manzili (Yunusobod 4-mavze...)"
            className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          />
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Bog'lanish uchun telefon (+998 90...)"
            className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          />
        </div>
      )}
    </div>

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
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPresetChange(key)}
            className="py-2 rounded-xl border text-xs font-bold cursor-pointer"
            style={{
              backgroundColor:
                pickupPreset === key ? 'var(--dx-secondary-container)' : 'var(--dx-bg)',
              borderColor: pickupPreset === key ? 'var(--dx-secondary)' : 'var(--dx-border)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  </>
);
