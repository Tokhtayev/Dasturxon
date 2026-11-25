import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ProductFormModal } from '../../components/owner/ProductFormModal';
import { formatSoM, getEffectivePrice } from '../../services/analytics';
import { getReadableErrorMessage } from '../../services/errors';
import type { Product, ProductStatus } from '../../types/domain';
import type { OwnerContextType } from './OwnerLayout';

const NEXT_STATUS_ACTION: Record<ProductStatus, { status: ProductStatus; label: string }> = {
  available: { status: 'hot_ready', label: 'Issiq qilish' },
  hot_ready: { status: 'sold_out', label: 'Tugatish' },
  sold_out: { status: 'available', label: 'Mavjud qilish' },
};

const PRODUCT_STATUS_BADGE: Record<ProductStatus, { label: string; bg: string; fg: string }> = {
  hot_ready: {
    label: '● Issiq tayyor',
    bg: 'var(--dx-tertiary-container)',
    fg: 'var(--dx-on-tertiary-container)',
  },
  sold_out: {
    label: 'Tugagan',
    bg: 'var(--dx-error-container)',
    fg: 'var(--dx-on-error-container)',
  },
  available: {
    label: 'Mavjud',
    bg: 'var(--dx-surface-variant)',
    fg: 'var(--dx-text)',
  },
};

export const OwnerProductsPage: React.FC = () => {
  const { products, createProduct, updateProduct, setProductStatus, deleteProduct } =
    useOutletContext<OwnerContextType>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSave = async (params: {
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
  }) => {
    if (params.productId) {
      await updateProduct({ productId: params.productId, ...params });
    } else {
      await createProduct(params);
    }
  };

  const handleSafeAction = async (work: () => Promise<void>) => {
    setActionError(null);
    try {
      await work();
    } catch (err) {
      setActionError(getReadableErrorMessage(err, 'Amalni bajarib bo‘lmadi.'));
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
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          <Plus className="w-4 h-4" /> Mahsulot qo‘shish
        </button>
      </div>

      {actionError && (
        <div
          className="p-3 rounded-2xl text-xs font-bold"
          style={{
            backgroundColor: 'var(--dx-error-container)',
            color: 'var(--dx-on-error-container)',
          }}
        >
          {actionError}
        </div>
      )}

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
          {products.map((product) => (
            <OwnerProductCard
              key={product.id}
              product={product}
              onEdit={(p) => {
                setEditing(p);
                setModalOpen(true);
              }}
              onToggleStatus={(id, next) => void handleSafeAction(() => setProductStatus(id, next))}
              onDelete={(id) => void handleSafeAction(() => deleteProduct(id))}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

interface OwnerProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggleStatus: (productId: string, nextStatus: ProductStatus) => void;
  onDelete: (productId: string) => void;
}

const OwnerProductCard: React.FC<OwnerProductCardProps> = ({
  product,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const nextStatus = NEXT_STATUS_ACTION[product.status];
  const badge = PRODUCT_STATUS_BADGE[product.status];

  return (
    <div
      className="p-4 rounded-2xl border space-y-3"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-base">{product.name}</div>
          <div className="text-xs" style={{ color: 'var(--dx-muted)' }}>
            {product.description || 'Tavsif kiritilmagan'}
          </div>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg shrink-0"
          style={{ backgroundColor: badge.bg, color: badge.fg }}
        >
          {badge.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="font-extrabold" style={{ color: 'var(--dx-primary)' }}>
          Sotish: {formatSoM(getEffectivePrice(product))}
        </span>
        <span style={{ color: 'var(--dx-secondary)' }}>
          🔒 Tannarx: {formatSoM(product.costPrice)}
        </span>
        {product.stock !== null && (
          <span style={{ color: 'var(--dx-muted)' }}>Zaxira: {product.stock} ta</span>
        )}
        {!product.published && (
          <span className="font-bold" style={{ color: 'var(--dx-error)' }}>
            Yashirin (unpublished)
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onToggleStatus(product.id, nextStatus.status)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
        >
          {nextStatus.label}
        </button>
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          style={{ borderColor: 'var(--dx-border)' }}
        >
          <Pencil className="w-3.5 h-3.5" /> Tahrirlash
        </button>
        <button
          type="button"
          onClick={() => onDelete(product.id)}
          className="px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
          style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-error)' }}
          aria-label="O'chirish"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
