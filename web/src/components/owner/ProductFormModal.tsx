import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, X } from 'lucide-react';
import { BYTES_PER_KILOBYTE, BUSINESS_TYPE_VISUALS } from '../../services/constants';
import { formatSoM } from '../../services/analytics';
import { getReadableErrorMessage } from '../../services/errors';
import { compressImageToBase64 } from '../../services/imageCompression';
import { validateProductForm } from '../../services/validators';
import {
  BUSINESS_TYPES,
  type BusinessTypeKey,
  type Product,
  type ProductStatus,
} from '../../types/domain';

const BASE64_OVERHEAD_RATIO = 0.75;

export interface ProductFormSaveParams {
  productId?: string;
  category: BusinessTypeKey;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  costPrice: number;
  stock: number | null;
  discountPercent: number;
  discountEndsAtMs: number | null;
  status: ProductStatus;
  published: boolean;
  wholesaleEnabled?: boolean;
  wholesaleMinQty?: number | null;
  wholesalePrice?: number | null;
}

interface ProductFormModalProps {
  editing: Product | null;
  defaultCategory: BusinessTypeKey;
  onClose: () => void;
  onSave: (params: ProductFormSaveParams) => Promise<void>;
}

interface FormFieldsState {
  category: BusinessTypeKey;
  name: string;
  description: string;
  imageUrl: string;
  priceText: string;
  costText: string;
  stockText: string;
  discountText: string;
  status: ProductStatus;
  published: boolean;
  wholesaleEnabled: boolean;
  wholesaleMinQtyText: string;
  wholesalePriceText: string;
}

function initialFormFields(
  editing: Product | null,
  defaultCategory: BusinessTypeKey
): FormFieldsState {
  return {
    category: editing?.category ?? defaultCategory,
    name: editing?.name ?? '',
    description: editing?.description ?? '',
    imageUrl: editing?.imageUrl ?? '',
    priceText: editing ? String(editing.price) : '',
    costText: editing && editing.costPrice > 0 ? String(editing.costPrice) : '',
    stockText: editing ? (editing.stock !== null ? String(editing.stock) : '') : '20',
    discountText: editing ? String(editing.discountPercent) : '0',
    status: editing?.status ?? 'hot_ready',
    published: editing?.published ?? true,
    wholesaleEnabled: Boolean(editing?.wholesaleEnabled),
    wholesaleMinQtyText:
      editing?.wholesaleMinQty && editing.wholesaleMinQty > 0
        ? String(editing.wholesaleMinQty)
        : '200',
    wholesalePriceText:
      editing?.wholesalePrice && editing.wholesalePrice > 0 ? String(editing.wholesalePrice) : '',
  };
}

function toSaveParams(fields: FormFieldsState, productId?: string): ProductFormSaveParams {
  return {
    productId,
    category: fields.category,
    name: fields.name,
    description: fields.description,
    imageUrl: fields.imageUrl,
    price: Number(fields.priceText),
    costPrice: fields.costText.trim() ? Number(fields.costText) : 0,
    stock: fields.stockText.trim() ? Number(fields.stockText) : null,
    discountPercent: fields.discountText.trim() ? Number(fields.discountText) : 0,
    discountEndsAtMs: null,
    status: fields.status,
    published: fields.published,
    wholesaleEnabled: fields.wholesaleEnabled,
    wholesaleMinQty: fields.wholesaleEnabled ? Number(fields.wholesaleMinQtyText) : null,
    wholesalePrice: fields.wholesaleEnabled ? Number(fields.wholesalePriceText) : null,
  };
}

function validateFieldsState(fields: FormFieldsState) {
  return validateProductForm({
    name: fields.name,
    priceText: fields.priceText,
    costPriceText: fields.costText,
    stockText: fields.stockText,
    discountText: fields.discountText,
    wholesaleEnabled: fields.wholesaleEnabled,
    wholesaleMinQtyText: fields.wholesaleMinQtyText,
    wholesalePriceText: fields.wholesalePriceText,
  });
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  editing,
  defaultCategory,
  onClose,
  onSave,
}) => {
  const [fields, setFields] = useState<FormFieldsState>(() =>
    initialFormFields(editing, defaultCategory)
  );
  const [compressingImage, setCompressingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const patch = (updates: Partial<FormFieldsState>) =>
    setFields((prev) => ({ ...prev, ...updates }));

  const handleImagePicked = async (file: File | undefined) => {
    if (!file) return;
    setFormErr(null);
    setCompressingImage(true);
    try {
      const dataUrl = await compressImageToBase64(file);
      patch({ imageUrl: dataUrl });
    } catch (err) {
      setFormErr(getReadableErrorMessage(err, 'Rasmni qayta ishlab bo‘lmadi.'));
    } finally {
      setCompressingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    const check = validateFieldsState(fields);
    if (!check.valid) return setFormErr(check.error ?? "Ma'lumotlarni tekshiring.");

    setSaving(true);
    try {
      await onSave(toSaveParams(fields, editing?.id));
      onClose();
    } catch (err) {
      setFormErr(getReadableErrorMessage(err, "Saqlab bo'lmadi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border p-6 space-y-3.5 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <ProductFormHeader editing={editing} onClose={onClose} />

        <ProductPhotoPicker
          imageUrl={fields.imageUrl}
          category={fields.category}
          compressing={compressingImage}
          onPickFile={(f) => void handleImagePicked(f)}
          onRemove={() => patch({ imageUrl: '' })}
        />

        <ProductTextFields
          name={fields.name}
          onNameChange={(name) => patch({ name })}
          category={fields.category}
          onCategoryChange={(category) => patch({ category })}
          description={fields.description}
          onDescriptionChange={(description) => patch({ description })}
        />

        <ProductNumericFields
          priceText={fields.priceText}
          onPriceChange={(priceText) => patch({ priceText })}
          costText={fields.costText}
          onCostChange={(costText) => patch({ costText })}
          stockText={fields.stockText}
          onStockChange={(stockText) => patch({ stockText })}
          discountText={fields.discountText}
          onDiscountChange={(discountText) => patch({ discountText })}
          status={fields.status}
          onStatusChange={(status) => patch({ status })}
          published={fields.published}
          onPublishedChange={(published) => patch({ published })}
        />

        <ProductWholesaleSection
          wholesaleEnabled={fields.wholesaleEnabled}
          onToggle={(wholesaleEnabled) => patch({ wholesaleEnabled })}
          minQtyText={fields.wholesaleMinQtyText}
          onMinQtyChange={(wholesaleMinQtyText) => patch({ wholesaleMinQtyText })}
          wholesalePriceText={fields.wholesalePriceText}
          onWholesalePriceChange={(wholesalePriceText) => patch({ wholesalePriceText })}
          costText={fields.costText}
        />

        {formErr && (
          <div
            role="alert"
            className="p-2.5 rounded-xl text-xs font-bold"
            style={{
              backgroundColor: 'var(--dx-error-container)',
              color: 'var(--dx-on-error-container)',
            }}
          >
            {formErr}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || compressingImage}
          className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
};

const ProductFormHeader: React.FC<{ editing: Product | null; onClose: () => void }> = ({
  editing,
  onClose,
}) => (
  <div className="flex items-center justify-between">
    <h2 className="font-display text-lg font-bold">
      {editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
    </h2>
    <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
      <X className="w-5 h-5" />
    </button>
  </div>
);

const ProductPhotoPicker: React.FC<{
  imageUrl: string;
  category: BusinessTypeKey;
  compressing: boolean;
  onPickFile: (file: File | undefined) => void;
  onRemove: () => void;
}> = ({ imageUrl, category, compressing, onPickFile, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const visual = BUSINESS_TYPE_VISUALS[category] ?? BUSINESS_TYPE_VISUALS.other;
  const approxKb = imageUrl
    ? Math.max(1, Math.round((imageUrl.length * BASE64_OVERHEAD_RATIO) / BYTES_PER_KILOBYTE))
    : 0;

  return (
    <div className="space-y-2">
      <div
        className="relative h-36 rounded-2xl border overflow-hidden flex items-center justify-center"
        style={{ background: visual.gradient, borderColor: 'var(--dx-border)' }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Mahsulot rasmi" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-white/95 space-y-1 px-4">
            <div className="text-4xl">{visual.icon}</div>
            <div className="text-[11px] font-bold">
              Rasm tanlanmagan (standart rasm ko‘rsatiladi)
            </div>
          </div>
        )}
        {imageUrl && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/65 text-white">
            ~{approxKb} KB JPEG
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            onPickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          className="hidden"
          data-testid="product-photo-input"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            onPickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          className="hidden"
        />
        <button
          type="button"
          disabled={compressing}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        >
          <ImagePlus className="w-3.5 h-3.5" /> {compressing ? 'Siqilmoqda…' : 'Rasm tanlash'}
        </button>
        <button
          type="button"
          disabled={compressing}
          onClick={() => cameraInputRef.current?.click()}
          className="px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        >
          <Camera className="w-3.5 h-3.5" /> Kamera
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Rasmni olib tashlash"
            className="px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer"
            style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-error)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
        Maksimal 5 MB; yuklashdan oldin avtomatik ≤ 800px JPEG qilib siqiladi.
      </p>
    </div>
  );
};

const ProductNumericFields: React.FC<{
  priceText: string;
  onPriceChange: (v: string) => void;
  costText: string;
  onCostChange: (v: string) => void;
  stockText: string;
  onStockChange: (v: string) => void;
  discountText: string;
  onDiscountChange: (v: string) => void;
  status: ProductStatus;
  onStatusChange: (v: ProductStatus) => void;
  published: boolean;
  onPublishedChange: (v: boolean) => void;
}> = ({
  priceText,
  onPriceChange,
  costText,
  onCostChange,
  stockText,
  onStockChange,
  discountText,
  onDiscountChange,
  status,
  onStatusChange,
  published,
  onPublishedChange,
}) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-[11px] font-bold block mb-1">Sotish narxi (so‘m)</label>
        <input
          type="number"
          value={priceText}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="5000"
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
      <div>
        <label className="text-[11px] font-bold block mb-1">Tannarxi (private)</label>
        <input
          type="number"
          value={costText}
          onChange={(e) => onCostChange(e.target.value)}
          placeholder="2800"
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-[11px] font-bold block mb-1">Zaxira (dona)</label>
        <input
          type="number"
          value={stockText}
          onChange={(e) => onStockChange(e.target.value)}
          placeholder="20"
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
      <div>
        <label className="text-[11px] font-bold block mb-1">Chegirma (0–90%)</label>
        <input
          type="number"
          value={discountText}
          onChange={(e) => onDiscountChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 items-center">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ProductStatus)}
        className="px-3 py-2 rounded-xl border text-xs font-bold"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        <option value="available">Mavjud</option>
        <option value="hot_ready">Hozir mavjud (issiq)</option>
        <option value="sold_out">Tugagan</option>
      </select>

      <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => onPublishedChange(e.target.checked)}
        />
        Mijozlarga mavjud
      </label>
    </div>
  </>
);

const ProductTextFields: React.FC<{
  name: string;
  onNameChange: (v: string) => void;
  category: BusinessTypeKey;
  onCategoryChange: (v: BusinessTypeKey) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
}> = ({ name, onNameChange, category, onCategoryChange, description, onDescriptionChange }) => (
  <>
    <input
      value={name}
      onChange={(e) => onNameChange(e.target.value)}
      placeholder="Mahsulot nomi (masalan: Tandir non)"
      className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
    <div>
      <label htmlFor="product-category" className="text-[11px] font-bold block mb-1">
        Toifa (Kategoriya)
      </label>
      <select
        id="product-category"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as BusinessTypeKey)}
        className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
        style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
      >
        {BUSINESS_TYPES.map((bt) => (
          <option key={bt.storedValue} value={bt.storedValue}>
            {bt.icon} {bt.labelUz}
          </option>
        ))}
      </select>
    </div>
    <textarea
      value={description}
      onChange={(e) => onDescriptionChange(e.target.value)}
      rows={2}
      placeholder="Tavsif (ixtiyoriy)"
      className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    />
  </>
);

const ProductWholesaleSection: React.FC<{
  wholesaleEnabled: boolean;
  onToggle: (val: boolean) => void;
  minQtyText: string;
  onMinQtyChange: (val: string) => void;
  wholesalePriceText: string;
  onWholesalePriceChange: (val: string) => void;
  costText: string;
}> = ({
  wholesaleEnabled,
  onToggle,
  minQtyText,
  onMinQtyChange,
  wholesalePriceText,
  onWholesalePriceChange,
  costText,
}) => {
  const minQty = Number(minQtyText);
  const wPrice = Number(wholesalePriceText);
  const cost = Number(costText);
  const previewValid = Number.isInteger(minQty) && minQty >= 2 && wPrice > 0;

  return (
    <div
      className="p-3.5 rounded-2xl border space-y-2.5"
      style={{
        backgroundColor: wholesaleEnabled ? 'var(--dx-secondary-container)' : 'var(--dx-bg)',
        borderColor: wholesaleEnabled ? 'var(--dx-secondary)' : 'var(--dx-border)',
      }}
    >
      <label className="inline-flex items-center gap-2 text-xs font-extrabold cursor-pointer">
        <input
          type="checkbox"
          checked={wholesaleEnabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        📦 Optom (ulgurji) savdoni yoqish
      </label>

      {wholesaleEnabled && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold block mb-1">Minimal soni (dona)</label>
              <input
                type="number"
                value={minQtyText}
                onChange={(e) => onMinQtyChange(e.target.value)}
                placeholder="200"
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">Optom narxi (1 dona)</label>
              <input
                type="number"
                value={wholesalePriceText}
                onChange={(e) => onWholesalePriceChange(e.target.value)}
                placeholder="2700"
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              />
            </div>
          </div>
          {previewValid && (
            <div className="text-[11px] font-bold" style={{ color: 'var(--dx-secondary)' }}>
              Partiya: {minQty} dona × {formatSoM(wPrice)} = {formatSoM(minQty * wPrice)}
              {cost > 0 ? ` · Foyda/dona: ${formatSoM(wPrice - cost)}` : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
};
