import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getReadableErrorMessage } from '../../services/errors';
import { validateProductForm } from '../../services/validators';
import type { Product, ProductStatus } from '../../types/domain';

interface ProductFormModalProps {
  editing: Product | null;
  onClose: () => void;
  onSave: (params: {
    productId?: string;
    name: string;
    description: string;
    price: number;
    costPrice: number;
    stock: number | null;
    discountPercent: number;
    discountEndsAtMs: number | null;
    status: ProductStatus;
    published: boolean;
  }) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ editing, onClose, onSave }) => {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [priceText, setPriceText] = useState(editing ? String(editing.price) : '');
  const [costText, setCostText] = useState(
    editing && editing.costPrice > 0 ? String(editing.costPrice) : ''
  );
  const [stockText, setStockText] = useState(
    editing ? (editing.stock !== null ? String(editing.stock) : '') : '20'
  );
  const [discountText, setDiscountText] = useState(editing ? String(editing.discountPercent) : '0');
  const [status, setStatus] = useState<ProductStatus>(editing?.status ?? 'hot_ready');
  const [published, setPublished] = useState(editing?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    const check = validateProductForm({
      name,
      priceText,
      costPriceText: costText,
      stockText,
      discountText,
    });
    if (!check.valid) {
      setFormErr(check.error ?? "Ma'lumotlarni tekshiring.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        productId: editing?.id,
        name,
        description,
        price: Number(priceText),
        costPrice: costText.trim() ? Number(costText) : 0,
        stock: stockText.trim() ? Number(stockText) : null,
        discountPercent: discountText.trim() ? Number(discountText) : 0,
        discountEndsAtMs: null,
        status,
        published,
      });
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
        className="w-full max-w-md rounded-3xl border p-6 space-y-3.5 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">
            {editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mahsulot nomi (masalan: Tandir non)"
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Tavsif (ixtiyoriy)"
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
        />

        <ProductNumericFields
          priceText={priceText}
          onPriceChange={setPriceText}
          costText={costText}
          onCostChange={setCostText}
          stockText={stockText}
          onStockChange={setStockText}
          discountText={discountText}
          onDiscountChange={setDiscountText}
          status={status}
          onStatusChange={setStatus}
          published={published}
          onPublishedChange={setPublished}
        />

        {formErr && (
          <div
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
          disabled={saving}
          className="w-full py-3 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </form>
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
        Xaridorlarga ko‘rsatish
      </label>
    </div>
  </>
);
