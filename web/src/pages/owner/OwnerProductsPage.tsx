import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { formatSoM, getEffectivePrice } from '../../services/analytics';
import { validateProductForm } from '../../services/validators';
import type { Product, ProductStatus } from '../../types/domain';
import type { OwnerContextType } from './OwnerLayout';

export const OwnerProductsPage: React.FC = () => {
  const { products, createProduct, updateProduct, setProductStatus, deleteProduct } =
    useOutletContext<OwnerContextType>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceText, setPriceText] = useState('');
  const [costText, setCostText] = useState('');
  const [stockText, setStockText] = useState('');
  const [discountText, setDiscountText] = useState('0');
  const [status, setStatus] = useState<ProductStatus>('available');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setPriceText('');
    setCostText('');
    setStockText('20');
    setDiscountText('0');
    setStatus('hot_ready');
    setPublished(true);
    setFormErr(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description);
    setPriceText(String(p.price));
    setCostText(p.costPrice > 0 ? String(p.costPrice) : '');
    setStockText(p.stock !== null ? String(p.stock) : '');
    setDiscountText(String(p.discountPercent));
    setStatus(p.status);
    setPublished(p.published);
    setFormErr(null);
    setModalOpen(true);
  };

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

    const payload = {
      name,
      description,
      price: Number(priceText),
      costPrice: costText.trim() ? Number(costText) : 0,
      stock: stockText.trim() ? Number(stockText) : null,
      discountPercent: discountText.trim() ? Number(discountText) : 0,
      discountEndsAtMs: null,
      status,
      published,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateProduct({ productId: editing.id, ...payload });
      } else {
        await createProduct(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Saqlab bo‘lmadi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Mahsulotlar ({products.length})</h1>
          <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
            Tannarx (<code className="font-mono-code">products/&#123;id&#125;/private/cost</code>)
            faqat sizga ko‘rinadi
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          <Plus className="w-4 h-4" /> Mahsulot qo‘shish
        </button>
      </div>

      {products.length === 0 ? (
        <div
          className="rounded-3xl p-10 text-center border"
          style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-bold text-sm">Hozircha mahsulotlar yo‘q</div>
          <p className="text-xs mt-1" style={{ color: 'var(--dx-muted)' }}>
            Yangi mahsulot qo‘shish tugmasini bosing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => {
            const nextStatus: { status: ProductStatus; label: string } =
              p.status === 'available'
                ? { status: 'hot_ready', label: 'Issiq qilish' }
                : p.status === 'hot_ready'
                  ? { status: 'sold_out', label: 'Tugatish' }
                  : { status: 'available', label: 'Mavjud qilish' };

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl border space-y-3"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-base">{p.name}</div>
                    <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
                      {p.description || 'Tavsif kiritilmagan'}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg shrink-0"
                    style={{
                      backgroundColor:
                        p.status === 'hot_ready'
                          ? 'var(--dx-tertiary-container)'
                          : p.status === 'sold_out'
                            ? 'var(--dx-error-container)'
                            : 'var(--dx-surface-variant)',
                      color:
                        p.status === 'hot_ready'
                          ? 'var(--dx-on-tertiary-container)'
                          : p.status === 'sold_out'
                            ? 'var(--dx-on-error-container)'
                            : 'var(--dx-text)',
                    }}
                  >
                    {p.status === 'hot_ready'
                      ? '● Issiq tayyor'
                      : p.status === 'sold_out'
                        ? 'Tugagan'
                        : 'Mavjud'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="font-extrabold" style={{ color: 'var(--dx-primary)' }}>
                    Sotish: {formatSoM(getEffectivePrice(p))}
                  </span>
                  <span style={{ color: 'var(--dx-secondary)' }}>
                    🔒 Tannarx: {formatSoM(p.costPrice)}
                  </span>
                  {p.stock !== null && (
                    <span style={{ color: 'var(--dx-muted)' }}>Zaxira: {p.stock} ta</span>
                  )}
                  {!p.published && (
                    <span className="font-bold" style={{ color: 'var(--dx-error)' }}>
                      Yashirin (unpublished)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void setProductStatus(p.id, nextStatus.status)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                  >
                    {nextStatus.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    style={{ borderColor: 'var(--dx-border)' }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Tahrirlash
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteProduct(p.id)}
                    className="px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
                    style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-error)' }}
                    aria-label="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
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
              <button type="button" onClick={() => setModalOpen(false)} className="cursor-pointer">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold block mb-1">Sotish narxi (so‘m)</label>
                <input
                  type="number"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
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
                  onChange={(e) => setCostText(e.target.value)}
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
                  onChange={(e) => setStockText(e.target.value)}
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
                  onChange={(e) => setDiscountText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
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
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Xaridorlarga ko‘rsatish
              </label>
            </div>

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
      )}
    </div>
  );
};
