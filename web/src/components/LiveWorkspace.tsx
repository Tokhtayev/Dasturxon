import React from 'react';
import { RotateCcw, ShieldCheck, ShoppingBag, Store } from 'lucide-react';
import type {
  AppNotification,
  AppRole,
  Business,
  BusinessStatus,
  CustomerOrder,
  Expense,
  FulfillmentType,
  OrderStatusKey,
  PaymentStatus,
  Product,
  ProductStatus,
} from '../types/dasturxon';
import type { Translations } from '../i18n/translations';
import { AdminWorkspace } from './AdminWorkspace';
import { CustomerWorkspace } from './CustomerWorkspace';
import { OwnerWorkspace } from './OwnerWorkspace';

interface LiveWorkspaceProps {
  t: Translations;
  activeRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  businesses: Business[];
  products: Product[];
  orders: CustomerOrder[];
  expenses: Expense[];
  notifications: AppNotification[];
  userName: string;
  onUpdateUserName: (name: string) => void;
  onMarkNotificationsRead: () => void;
  onPlaceOrder: (payload: {
    product: Product;
    quantity: number;
    fulfillmentType: FulfillmentType;
    deliveryAddress: string;
    customerPhone: string;
    pickupTime: number;
  }) => void;
  onCancelOrder: (orderId: string) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProductStatus: (productId: string, status: ProductStatus) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatusKey) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateBusiness: (id: string, patch: Partial<Business>) => void;
  onSetBusinessStatus: (id: string, status: BusinessStatus, rejectionReason?: string) => void;
  onResetDemo: () => void;
  focusedShopId: string | null;
  onClearFocusedShop: () => void;
}

export const LiveWorkspace: React.FC<LiveWorkspaceProps> = ({
  t,
  activeRole,
  onRoleChange,
  businesses,
  products,
  orders,
  expenses,
  notifications,
  userName,
  onUpdateUserName,
  onMarkNotificationsRead,
  onPlaceOrder,
  onCancelOrder,
  onAddProduct,
  onUpdateProductStatus,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onAddExpense,
  onDeleteExpense,
  onUpdateBusiness,
  onSetBusinessStatus,
  onResetDemo,
  focusedShopId,
  onClearFocusedShop,
}) => {
  const primaryOwnerBusiness =
    businesses.find((b) => b.id === 'demo_bakery_baraka') ?? businesses[0];

  return (
    <section
      id="live-app"
      className="py-16 sm:py-20 border-t"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--dx-primary-container) 16%, var(--dx-bg))',
        borderColor: 'var(--dx-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-2xl space-y-2.5">
            <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: 'var(--dx-primary)' }}>
              {t.workspaceEyebrow}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--dx-text)' }}>
              {t.workspaceTitle}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--dx-muted)' }}>
              {t.workspaceSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 3-Role Switcher */}
            <div
              className="inline-flex rounded-2xl p-1 border gap-1"
              style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
            >
              {(
                [
                  { id: 'customer', label: t.roleCustomer, Icon: ShoppingBag },
                  { id: 'owner', label: t.roleOwner, Icon: Store },
                  { id: 'admin', label: t.roleAdmin, Icon: ShieldCheck },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = activeRole === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onRoleChange(id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    style={{
                      backgroundColor: active ? 'var(--dx-primary)' : 'transparent',
                      color: active ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onResetDemo}
              title={t.resetDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold cursor-pointer hover:opacity-85"
              style={{
                backgroundColor: 'var(--dx-surface)',
                borderColor: 'var(--dx-border)',
                color: 'var(--dx-muted)',
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetDemo}</span>
            </button>
          </div>
        </div>

        {/* Active Role Shell */}
        {activeRole === 'customer' && (
          <CustomerWorkspace
            businesses={businesses}
            products={products}
            orders={orders}
            notifications={notifications}
            userName={userName}
            onUpdateUserName={onUpdateUserName}
            onMarkNotificationsRead={onMarkNotificationsRead}
            onPlaceOrder={onPlaceOrder}
            onCancelOrder={onCancelOrder}
            onSwitchToOwner={() => onRoleChange('owner')}
            focusedShopId={focusedShopId}
            onClearFocusedShop={onClearFocusedShop}
          />
        )}

        {activeRole === 'owner' && (
          <OwnerWorkspace
            business={primaryOwnerBusiness}
            products={products}
            orders={orders}
            expenses={expenses}
            onSwitchToCustomer={() => onRoleChange('customer')}
            onAddProduct={onAddProduct}
            onUpdateProductStatus={onUpdateProductStatus}
            onDeleteProduct={onDeleteProduct}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onUpdatePaymentStatus={onUpdatePaymentStatus}
            onAddExpense={onAddExpense}
            onDeleteExpense={onDeleteExpense}
            onUpdateBusiness={(patch) => onUpdateBusiness(primaryOwnerBusiness.id, patch)}
          />
        )}

        {activeRole === 'admin' && (
          <AdminWorkspace
            businesses={businesses}
            onSetBusinessStatus={onSetBusinessStatus}
          />
        )}
      </div>
    </section>
  );
};
