import React, { useState } from 'react';
import { Check, Minus, PhoneCall, Plus, ShieldCheck, ShoppingBag, Truck, X } from 'lucide-react';
import { formatSoM, getEffectivePrice } from '../../services/analytics';
import {
  MAX_ORDER_QUANTITY,
  MIN_ORDER_QUANTITY,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
} from '../../services/constants';
import { getReadableErrorMessage } from '../../services/errors';
import { compressImageToBase64 } from '../../services/imageCompression';
import { calculateOrderPrepayment } from '../../services/orderLogic';
import {
  buildTelHref,
  formatContactPhoneDisplay,
  isValidContactPhone,
} from '../../services/validators';
import type { FulfillmentType, Product } from '../../types/domain';
import { ReceiptPhotoPicker } from '../ReceiptPhotoPicker';

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
    advanceReceiptUrl?: string;
  }) => Promise<void>;
}

function validateCheckoutInput(params: {
  outOfStock: boolean;
  stock: number | null;
  qty: number;
  fulfillment: FulfillmentType;
  deliveryAddress: string;
  contactPhone: string;
}): string | null {
  if (params.outOfStock) return 'Ushbu mahsulot tugagan.';
  if (params.stock !== null && params.qty > params.stock) {
    return `Zaxira yetarli emas (${params.stock} ta mavjud).`;
  }
  if (params.fulfillment === 'delivery' && !params.deliveryAddress.trim()) {
    return 'Yetkazib berish uchun manzilni kiriting.';
  }
  if (!isValidContactPhone(params.contactPhone)) {
    return "Bog'lanish uchun telefon raqamingizni kiriting (+998 90 123 45 67).";
  }
  return null;
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
  const [advanceReceiptUrl, setAdvanceReceiptUrl] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const totalPrice = getEffectivePrice(product) * qty;
  const { prepaymentAmount, remainingAmount } = calculateOrderPrepayment(totalPrice);
  const outOfStock =
    product.status === 'sold_out' || (product.stock !== null && product.stock <= 0);

  const handlePickAdvanceFile = async (file: File | undefined) => {
    if (!file) return;
    setCheckoutError(null);
    setCompressing(true);
    try {
      setAdvanceReceiptUrl(await compressImageToBase64(file));
    } catch (err) {
      setCheckoutError(getReadableErrorMessage(err, 'Chek rasmini qayta ishlab bo‘lmadi.'));
    } finally {
      setCompressing(false);
    }
  };

  const handleConfirm = async () => {
    setCheckoutError(null);
    const validationErr = validateCheckoutInput({
      outOfStock,
      stock: product.stock,
      qty,
      fulfillment,
      deliveryAddress,
      contactPhone,
    });
    if (validationErr) {
      setCheckoutError(validationErr);
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
        advanceReceiptUrl: advanceReceiptUrl || undefined,
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
        <CheckoutModalHeader submitting={submitting} onClose={onClose} />

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

        <CheckoutPrepaymentSection
          totalPrice={totalPrice}
          prepaymentAmount={prepaymentAmount}
          remainingAmount={remainingAmount}
          businessPhone={product.businessPhone}
          receiptUrl={advanceReceiptUrl}
          busy={compressing || submitting}
          compressing={compressing}
          onPickFile={(f) => void handlePickAdvanceFile(f)}
          onClear={() => setAdvanceReceiptUrl('')}
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

        <CheckoutFooter
          totalPrice={totalPrice}
          prepaymentAmount={prepaymentAmount}
          remainingAmount={remainingAmount}
          submitting={submitting}
          busy={submitting || compressing}
          onConfirm={() => void handleConfirm()}
        />
      </div>
    </div>
  );
};

const CheckoutModalHeader: React.FC<{ submitting: boolean; onClose: () => void }> = ({
  submitting,
  onClose,
}) => (
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
);

const CheckoutFooter: React.FC<{
  totalPrice: number;
  prepaymentAmount: number;
  remainingAmount: number;
  submitting: boolean;
  busy: boolean;
  onConfirm: () => void;
}> = ({ totalPrice, prepaymentAmount, remainingAmount, submitting, busy, onConfirm }) => (
  <div
    className="pt-3 border-t flex items-center justify-between gap-2"
    style={{ borderColor: 'var(--dx-border)' }}
  >
    <div>
      <div className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
        Jami: {formatSoM(totalPrice)} · Qolgan: {formatSoM(remainingAmount)}
      </div>
      <div className="text-lg font-extrabold" style={{ color: 'var(--dx-primary)' }}>
        Avans (50%): {formatSoM(prepaymentAmount)}
      </div>
    </div>
    <button
      type="button"
      disabled={busy}
      onClick={onConfirm}
      className="px-5 py-3 rounded-2xl text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
      style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
    >
      <Check className="w-4 h-4" /> {submitting ? 'Yuborilmoqda…' : 'Buyurtma berish'}
    </button>
  </div>
);

const CheckoutPrepaymentSection: React.FC<{
  totalPrice: number;
  prepaymentAmount: number;
  remainingAmount: number;
  businessPhone?: string;
  receiptUrl: string;
  busy: boolean;
  compressing: boolean;
  onPickFile: (file: File | undefined) => void;
  onClear: () => void;
}> = ({
  totalPrice,
  prepaymentAmount,
  remainingAmount,
  businessPhone,
  receiptUrl,
  busy,
  compressing,
  onPickFile,
  onClear,
}) => {
  const cleanPhone = formatContactPhoneDisplay(businessPhone);
  return (
    <div
      className="rounded-2xl p-3.5 border space-y-2.5"
      style={{
        backgroundColor: 'var(--dx-secondary-container)',
        borderColor: 'var(--dx-secondary)',
      }}
    >
      <div className="flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--dx-secondary)' }} />
        <div className="text-xs space-y-0.5">
          <div className="font-extrabold">50% oldindan to‘lov (avans)</div>
          <p className="text-[11px] leading-snug" style={{ color: 'var(--dx-muted)' }}>
            Buyurtma bekor bo‘lib ketmasligi uchun <strong>{formatSoM(prepaymentAmount)}</strong>{' '}
            (50%) oldindan to‘lanadi, qolgan <strong>{formatSoM(remainingAmount)}</strong> olishda
            to‘lanadi (Jami: {formatSoM(totalPrice)}).
          </p>
        </div>
      </div>
      {cleanPhone && (
        <div className="flex items-center justify-between text-[11px] gap-2">
          <span style={{ color: 'var(--dx-muted)' }}>Karta/Payme ma’lumoti uchun qo‘ng‘iroq:</span>
          <a
            href={buildTelHref(cleanPhone)}
            className="font-bold underline inline-flex items-center gap-1 shrink-0"
            style={{ color: 'var(--dx-secondary)' }}
          >
            <PhoneCall className="w-3 h-3" /> {cleanPhone}
          </a>
        </div>
      )}
      <ReceiptPhotoPicker
        receiptUrl={receiptUrl}
        emptyHint="50% avans chekini hozir yuklashingiz yoki buyurtmadan keyin «Buyurtmalarim»da biriktirishingiz mumkin."
        busy={busy}
        compressing={compressing}
        onPickFile={onPickFile}
        onClear={onClear}
      />
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
        <div className="pt-1">
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Yetkazib berish manzili (Yunusobod 4-mavze...)"
            className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
            style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
          />
        </div>
      )}
      <div className="space-y-1 pt-1">
        <label htmlFor="checkout-phone" className="text-xs font-bold block">
          Bog‘lanish uchun telefon
        </label>
        <input
          id="checkout-phone"
          type="tel"
          value={contactPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+998 90 123 45 67"
          className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
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
