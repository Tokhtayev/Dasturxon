import React, { useMemo, useState } from 'react';
import {
  ClipboardList,
  LayoutDashboard,
  Package,
  Plus,
  Trash2,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import type {
  Business,
  CustomerOrder,
  Expense,
  OrderStatusKey,
  PaymentStatus,
  Product,
  ProductStatus,
} from '../types/dasturxon';
import { BUSINESS_TYPES } from '../data/demoData';
import {
  calculateAnalytics,
  formatSoM,
  getEffectivePrice,
  type AnalyticsPeriod,
} from '../utils/analytics';
import { OrderStatusDonutChart, RevenueLineChart } from './Charts';
import { DxLogo } from './DxLogo';
import { StatusChip } from './StatusChip';

interface OwnerWorkspaceProps {
  business: Business;
  products: Product[];
  orders: CustomerOrder[];
  expenses: Expense[];
  onSwitchToCustomer: () => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProductStatus: (productId: string, status: ProductStatus) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatusKey) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateBusiness: (patch: Partial<Business>) => void;
}

type OwnerTab = 'dashboard' | 'products' | 'orders' | 'analytics' | 'profile';

export const OwnerWorkspace: React.FC<OwnerWorkspaceProps> = ({
  business,
  products,
  orders,
  expenses,
  onSwitchToCustomer,
  onAddProduct,
  onUpdateProductStatus,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onAddExpense,
  onDeleteExpense,
  onUpdateBusiness,
}) => {
  const [tab, setTab] = useState<OwnerTab>('dashboard');
  const [prodFilter, setProdFilter] = useState<'all' | ProductStatus | 'discount'>('all');
  const [orderSegment, setOrderSegment] = useState<'new' | 'progress' | 'history'>('new');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('7d');

  // Modals
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditBiz, setShowEditBiz] = useState(false);

  // Add Product fields
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('12000');
  const [pCost, setPCost] = useState('7000');
  const [pStock, setPStock] = useState('20');
  const [pDiscount, setPDiscount] = useState('0');
  const [pImage, setPImage] = useState('./images/food_tandir_non.jpg');
  const [pErr, setPErr] = useState<string | null>(null);

  // Add Expense fields
  const [eTitle, setETitle] = useState('');
  const [eAmount, setEAmount] = useState('');
  const [eCat, setECat] = useState('Xomashyo');

  // Edit Business fields
  const [bName, setBName] = useState(business.name);
  const [bAddress, setBAddress] = useState(business.address);
  const [bPhone, setBPhone] = useState(business.phone);

  const ownerProducts = useMemo(
    () => products.filter((p) => p.businessId === business.id),
    [products, business.id]
  );

  const ownerOrders = useMemo(
    () =>
      [...orders]
        .filter((o) => o.businessId === business.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [orders, business.id]
  );

  const ownerExpenses = useMemo(
    () =>
      [...expenses]
        .filter((e) => e.businessId === business.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [expenses, business.id]
  );

  const completedRevenue = useMemo(
    () =>
      ownerOrders
        .filter((o) => o.status === 'completed' && o.paymentStatus === 'paid')
        .reduce((s, o) => s + o.totalPrice, 0),
    [ownerOrders]
  );

  const activeOrdersCount = useMemo(
    () => ownerOrders.filter((o) => ['pending', 'accepted', 'ready'].includes(o.status)).length,
    [ownerOrders]
  );
  const lowStockCount = useMemo(
    () => ownerProducts.filter((p) => (p.stock ?? 999) < 5).length,
    [ownerProducts]
  );
  const pendingOrders = useMemo(
    () => ownerOrders.filter((o) => o.status === 'pending'),
    [ownerOrders]
  );

  const filteredProducts = useMemo(() => {
    if (prodFilter === 'all') return ownerProducts;
    if (prodFilter === 'discount') return ownerProducts.filter((p) => p.discountPercent > 0);
    return ownerProducts.filter((p) => p.status === prodFilter);
  }, [ownerProducts, prodFilter]);

  const filteredOrders = useMemo(() => {
    if (orderSegment === 'new') return ownerOrders.filter((o) => o.status === 'pending');
    if (orderSegment === 'progress')
      return ownerOrders.filter((o) => ['accepted', 'ready'].includes(o.status));
    return ownerOrders.filter((o) => ['completed', 'rejected', 'cancelled'].includes(o.status));
  }, [ownerOrders, orderSegment]);

  const report = useMemo(
    () => calculateAnalytics(ownerOrders, ownerExpenses, ownerProducts, analyticsPeriod),
    [ownerOrders, ownerExpenses, ownerProducts, analyticsPeriod]
  );

  const handleCreateProduct = () => {
    const price = Number(pPrice);
    const costPrice = Number(pCost) || 0;
    const stock = pStock.trim() ? Number(pStock) : null;
    const discount = Number(pDiscount) || 0;
    if (!pName.trim()) {
      setPErr('Mahsulot nomini kiriting.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setPErr("Sotish narxi 0 dan katta bo'lishi kerak.");
      return;
    }
    if (discount < 0 || discount > 90) {
      setPErr("Chegirma 0 dan 90% gacha bo'lishi kerak.");
      return;
    }
    onAddProduct({
      businessId: business.id,
      businessName: business.name,
      businessType: business.type,
      businessAddress: business.address,
      businessPhone: business.phone,
      name: pName.trim(),
      description: pDesc.trim() || 'Yangi pishirilgan mahalliy mahsulot.',
      price,
      costPrice,
      status: 'hot_ready',
      stock,
      discountPercent: discount,
      discountEndsAt: discount > 0 ? Date.now() + 3 * 86400000 : null,
      published: true,
      imageUrl: pImage,
    });
    setPName('');
    setPDesc('');
    setPErr(null);
    setShowAddProduct(false);
  };

  const handleCreateExpense = () => {
    const amount = Number(eAmount);
    if (!eTitle.trim() || !Number.isFinite(amount) || amount <= 0) return;
    onAddExpense({
      businessId: business.id,
      title: eTitle.trim(),
      amount,
      category: eCat,
    });
    setETitle('');
    setEAmount('');
    setShowAddExpense(false);
  };

  return (
    <div
      className="rounded-3xl border overflow-hidden shadow-xl flex flex-col"
      style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
    >
      {/* Top Bar */}
      <div
        className="px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        <DxLogo size={32} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToCustomer}
            className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
            style={{
              backgroundColor: 'var(--dx-secondary-container)',
              color: 'var(--dx-on-secondary-container)',
            }}
          >
            🛒 Xaridor rejimi
          </button>
          <span
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold"
            style={{
              backgroundColor: 'var(--dx-primary-container)',
              color: 'var(--dx-on-primary-container)',
            }}
          >
            {business.name}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 min-h-[560px]">
        {/* TAB: DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl font-bold">Boshqaruv paneli</h3>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    business.status === 'approved'
                      ? 'var(--dx-tertiary-container)'
                      : 'var(--dx-primary-container)',
                  color:
                    business.status === 'approved'
                      ? 'var(--dx-on-tertiary-container)'
                      : 'var(--dx-on-primary-container)',
                }}
              >
                {business.status === 'approved' ? '✓ Tasdiqlangan biznes' : '⏳ Admin ko‘rib chiqmoqda'}
              </span>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <KpiBox title="Jami buyurtmalar" value={`${ownerOrders.length} ta`} />
              <KpiBox title="To‘langan tushum" value={formatSoM(completedRevenue)} accent="var(--dx-primary)" />
              <KpiBox title="Faol buyurtmalar" value={`${activeOrdersCount} ta`} accent="var(--dx-secondary)" />
              <KpiBox title="Kam qolgan (<5)" value={`${lowStockCount} ta`} accent={lowStockCount > 0 ? '#BA1A1A' : 'var(--dx-tertiary)'} />
            </div>

            {/* Pending Orders Needing Attention */}
            {pendingOrders.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-base">
                  Diqqat talab qiladi ({pendingOrders.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {pendingOrders.map((order) => (
                    <OwnerOrderCard
                      key={order.id}
                      order={order}
                      onAdvance={(next) => onUpdateOrderStatus(order.id, next)}
                      onTogglePay={(p) => onUpdatePaymentStatus(order.id, p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-base">Tezkor amallar</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="p-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                >
                  <Plus className="w-4 h-4" /> Mahsulot qo‘shish
                </button>
                <button
                  type="button"
                  onClick={() => setTab('orders')}
                  className="p-3.5 rounded-2xl border text-sm font-bold cursor-pointer"
                  style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                >
                  📋 Buyurtmalar ({ownerOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab('analytics')}
                  className="p-3.5 rounded-2xl border text-sm font-bold cursor-pointer"
                  style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                >
                  📈 Moliyaviy tahlil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PRODUCTS */}
        {tab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold">Mahsulotlar ({ownerProducts.length})</h3>
                <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>
                  Tannarxi (<code className="font-mono-code">costPrice</code>) faqat sizning kabinetingizda ko‘rinadi — xaridorlarga berkitilgan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
              >
                <Plus className="w-4 h-4" /> Qo‘shish
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {(
                [
                  ['all', 'Hammasi'],
                  ['available', 'Mavjud'],
                  ['hot_ready', '● Issiq tayyor'],
                  ['sold_out', 'Tugagan'],
                  ['discount', 'Chegirmali'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProdFilter(key)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer"
                  style={{
                    backgroundColor: prodFilter === key ? 'var(--dx-primary)' : 'var(--dx-surface)',
                    color: prodFilter === key ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                    borderColor: 'var(--dx-border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((p) => {
                const nextMap: Record<ProductStatus, { next: ProductStatus; label: string }> = {
                  available: { next: 'hot_ready', label: 'Issiq qilish' },
                  hot_ready: { next: 'sold_out', label: 'Tugatish' },
                  sold_out: { next: 'available', label: 'Mavjud qilish' },
                };
                const nextAction = nextMap[p.status];
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border p-4 flex gap-3.5 items-start"
                    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
                  >
                    <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm truncate">{p.name}</div>
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg shrink-0"
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
                            ? 'Issiq tayyor'
                            : p.status === 'sold_out'
                              ? 'Tugagan'
                              : 'Mavjud'}
                        </span>
                      </div>

                      <div className="text-xs flex flex-wrap gap-x-3 gap-y-0.5">
                        <span className="font-extrabold" style={{ color: 'var(--dx-primary)' }}>
                          Sotuv: {formatSoM(getEffectivePrice(p))}
                        </span>
                        <span style={{ color: 'var(--dx-secondary)' }}>
                          🔒 Tannarxi: {formatSoM(p.costPrice)}
                        </span>
                        {p.stock !== null && (
                          <span style={{ color: 'var(--dx-muted)' }}>Zaxira: {p.stock} ta</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onUpdateProductStatus(p.id, nextAction.next)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                          style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
                        >
                          {nextAction.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 rounded-xl border cursor-pointer"
                          style={{ borderColor: 'var(--dx-border)', color: 'var(--dx-error)' }}
                          aria-label="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex gap-2 border-b pb-3" style={{ borderColor: 'var(--dx-border)' }}>
              {(
                [
                  ['new', `Yangi (${ownerOrders.filter((o) => o.status === 'pending').length})`],
                  ['progress', `Jarayonda (${ownerOrders.filter((o) => ['accepted', 'ready'].includes(o.status)).length})`],
                  ['history', `Tarix (${ownerOrders.filter((o) => ['completed', 'rejected', 'cancelled'].includes(o.status)).length})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setOrderSegment(k)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: orderSegment === k ? 'var(--dx-primary)' : 'var(--dx-surface)',
                    color: orderSegment === k ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="font-bold text-sm">Bu bo‘limda buyurtmalar yo‘q</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredOrders.map((order) => (
                  <OwnerOrderCard
                    key={order.id}
                    order={order}
                    onAdvance={(next) => onUpdateOrderStatus(order.id, next)}
                    onTogglePay={(p) => onUpdatePaymentStatus(order.id, p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ANALYTICS */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold">Biznes Tahlili · AnalyticsCalculator</h3>
              <div className="flex gap-1.5">
                {(
                  [
                    ['today', 'Bugun'],
                    ['7d', '7 kun'],
                    ['30d', '30 kun'],
                    ['all', 'Barchasi'],
                  ] as const
                ).map(([pKey, label]) => (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setAnalyticsPeriod(pKey)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor: analyticsPeriod === pKey ? 'var(--dx-primary)' : 'var(--dx-surface)',
                      color: analyticsPeriod === pKey ? 'var(--dx-on-primary)' : 'var(--dx-text)',
                      borderColor: 'var(--dx-border)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6 Financial & Operational KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
              <KpiBox title="Jami daromad (paid)" value={formatSoM(report.totalRevenue)} accent="var(--dx-primary)" />
              <KpiBox title="Jami xarajatlar" value={formatSoM(report.totalExpenses)} />
              <KpiBox title="Yalpi foyda (Rev − COGS)" value={formatSoM(report.grossProfit)} accent="var(--dx-secondary)" />
              <KpiBox
                title="Sof foyda (Gross − Exp)"
                value={formatSoM(report.netProfit)}
                accent={report.netProfit >= 0 ? 'var(--dx-tertiary)' : '#BA1A1A'}
              />
              <KpiBox title="O‘rtacha chek" value={formatSoM(report.averageTicket)} />
              <KpiBox title="Bajarilish darajasi" value={`${Math.round(report.completionRate * 100)}%`} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div
                className="lg:col-span-7 p-5 rounded-2xl border space-y-2"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              >
                <div className="font-bold text-sm">Tushum grafigi (ming so‘mda)</div>
                <RevenueLineChart data={report.trendPoints} />
              </div>

              <div
                className="lg:col-span-5 p-5 rounded-2xl border space-y-2"
                style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
              >
                <div className="font-bold text-sm">Buyurtmalar holati taqsimoti</div>
                <OrderStatusDonutChart
                  completed={report.completedOrders}
                  inProgress={report.inProgressOrders}
                  cancelled={report.cancelledOrders}
                />
              </div>
            </div>

            {/* Product Profitability Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="font-bold text-sm">🔥 Eng ko‘p sotilgan mahsulotlar</div>
                {report.bestSellers.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>Bu davrda yakunlangan sotuvlar yo‘q.</p>
                ) : (
                  report.bestSellers.slice(0, 3).map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold">{item.productName}</div>
                        <div style={{ color: 'var(--dx-muted)' }}>{item.quantitySold} ta sotilgan</div>
                      </div>
                      <div className="font-extrabold" style={{ color: 'var(--dx-primary)' }}>
                        {formatSoM(item.revenue)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
                <div className="font-bold text-sm">💎 Eng foydali mahsulotlar</div>
                {report.mostProfitable.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--dx-muted)' }}>Foyda ma’lumotlari yo‘q.</p>
                ) : (
                  report.mostProfitable.slice(0, 3).map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold">{item.productName}</div>
                        <div style={{ color: 'var(--dx-muted)' }}>Tannarxi: {formatSoM(item.costPrice)}</div>
                      </div>
                      <div className="font-extrabold" style={{ color: 'var(--dx-tertiary)' }}>
                        +{formatSoM(item.profit)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expenses Manager */}
            <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm">Biznes xarajatlari ({ownerExpenses.length})</div>
                <button
                  type="button"
                  onClick={() => setShowAddExpense(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
                >
                  + Xarajat qo‘shish
                </button>
              </div>
              <div className="space-y-2">
                {ownerExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs"
                    style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                  >
                    <div>
                      <div className="font-bold">{exp.title}</div>
                      <div style={{ color: 'var(--dx-muted)' }}>{exp.category}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold">{formatSoM(exp.amount)}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1 cursor-pointer"
                        style={{ color: 'var(--dx-error)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {tab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="p-6 rounded-3xl border space-y-3" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
              <div className="flex items-center gap-3.5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold"
                  style={{ backgroundColor: 'var(--dx-primary-container)', color: 'var(--dx-on-primary-container)' }}
                >
                  {business.name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="font-display text-xl font-bold">{business.name}</h4>
                  <div className="text-xs" style={{ color: 'var(--dx-secondary)' }}>
                    {BUSINESS_TYPES.find((t) => t.storedValue === business.type)?.icon}{' '}
                    {BUSINESS_TYPES.find((t) => t.storedValue === business.type)?.labelUz}
                  </div>
                </div>
              </div>
              <div className="text-sm space-y-1 pt-2" style={{ color: 'var(--dx-muted)' }}>
                <div>📍 Manzil: {business.address}</div>
                <div>📞 Telefon: {business.phone}</div>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBName(business.name);
                    setBAddress(business.address);
                    setBPhone(business.phone);
                    setShowEditBiz(true);
                  }}
                  className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer"
                  style={{ borderColor: 'var(--dx-border)' }}
                >
                  Biznes ma’lumotlarini tahrirlash
                </button>
                <button
                  type="button"
                  onClick={onSwitchToCustomer}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: 'var(--dx-secondary-container)', color: 'var(--dx-on-secondary-container)' }}
                >
                  🛒 Xaridor rejimiga o‘tish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom 5-Tab Bar */}
      <div
        className="border-t px-2 py-2 grid grid-cols-5 gap-1"
        style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
      >
        {(
          [
            { id: 'dashboard', label: 'Boshqaruv', Icon: LayoutDashboard },
            { id: 'products', label: 'Mahsulotlar', Icon: Package },
            { id: 'orders', label: 'Buyurtmalar', Icon: ClipboardList },
            { id: 'analytics', label: 'Analitika', Icon: TrendingUp },
            { id: 'profile', label: 'Siz', Icon: User },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="py-2 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-bold cursor-pointer"
              style={{
                backgroundColor: active ? 'var(--dx-primary-container)' : 'transparent',
                color: active ? 'var(--dx-on-primary-container)' : 'var(--dx-muted)',
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-full px-1">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border p-6 space-y-3.5" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-bold">Yangi mahsulot qo‘shish</h4>
              <button type="button" onClick={() => setShowAddProduct(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Mahsulot nomi (masalan: Issiq shirmoy non)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <input
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="Tavsif (ixtiyoriy)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold block mb-1">Sotish narxi (so‘m)</label>
                <input
                  type="number"
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1">Tannarxi (private)</label>
                <input
                  type="number"
                  value={pCost}
                  onChange={(e) => setPCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold block mb-1">Zaxira (dona)</label>
                <input
                  type="number"
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold block mb-1">Chegirma (0-90%)</label>
                <input
                  type="number"
                  value={pDiscount}
                  onChange={(e) => setPDiscount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">Mahsulot rasmi</label>
              <select
                value={pImage}
                onChange={(e) => setPImage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
              >
                <option value="./images/food_tandir_non.jpg">Tandir non</option>
                <option value="./images/food_patir_non.jpg">Patir non</option>
                <option value="./images/food_somsa.jpg">Somsa</option>
                <option value="./images/food_plov.jpg">Palov</option>
                <option value="./images/food_shashlik.jpg">Shashlik</option>
                <option value="./images/food_medovik.jpg">Medovik tort</option>
              </select>
            </div>
            {pErr && <div className="text-xs font-bold" style={{ color: 'var(--dx-error)' }}>{pErr}</div>}
            <button
              type="button"
              onClick={handleCreateProduct}
              className="w-full py-3 rounded-2xl text-sm font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              Mahsulotni saqlash
            </button>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border p-6 space-y-3.5" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-bold">Xarajat qo‘shish</h4>
              <button type="button" onClick={() => setShowAddExpense(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={eTitle}
              onChange={(e) => setETitle(e.target.value)}
              placeholder="Xarajat nomi (masalan: Sariyog' va kunjut)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <input
              type="number"
              value={eAmount}
              onChange={(e) => setEAmount(e.target.value)}
              placeholder="Summa (so'm)"
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <select
              value={eCat}
              onChange={(e) => setECat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            >
              <option value="Xomashyo">Xomashyo</option>
              <option value="Kommunal">Kommunal</option>
              <option value="Ish haqi">Ish haqi</option>
              <option value="Boshqa">Boshqa</option>
            </select>
            <button
              type="button"
              onClick={handleCreateExpense}
              className="w-full py-3 rounded-2xl text-sm font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              Saqlash
            </button>
          </div>
        </div>
      )}

      {/* Edit Business Modal */}
      {showEditBiz && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border p-6 space-y-3.5" style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}>
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-bold">Biznesni tahrirlash</h4>
              <button type="button" onClick={() => setShowEditBiz(false)} className="cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <input
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <input
              value={bAddress}
              onChange={(e) => setBAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <input
              value={bPhone}
              onChange={(e) => setBPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
              style={{ backgroundColor: 'var(--dx-bg)', borderColor: 'var(--dx-border)' }}
            />
            <button
              type="button"
              onClick={() => {
                if (bName.trim()) {
                  onUpdateBusiness({
                    name: bName.trim(),
                    address: bAddress.trim(),
                    phone: bPhone.trim(),
                  });
                  setShowEditBiz(false);
                }
              }}
              className="w-full py-3 rounded-2xl text-sm font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              Saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiBox: React.FC<{ title: string; value: string; accent?: string }> = ({
  title,
  value,
  accent,
}) => (
  <div
    className="p-4 rounded-2xl border space-y-1.5"
    style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
  >
    <div className="text-[11px] font-bold" style={{ color: 'var(--dx-muted)' }}>
      {title}
    </div>
    <div className="text-lg sm:text-xl font-extrabold" style={{ color: accent ?? 'var(--dx-text)' }}>
      {value}
    </div>
  </div>
);

interface OwnerOrderCardProps {
  order: CustomerOrder;
  onAdvance: (next: OrderStatusKey) => void;
  onTogglePay: (status: PaymentStatus) => void;
}

const OwnerOrderCard: React.FC<OwnerOrderCardProps> = ({ order, onAdvance, onTogglePay }) => {
  const nextStep: { next: OrderStatusKey; label: string } | null =
    order.status === 'pending'
      ? { next: 'accepted', label: 'Qabul qilish' }
      : order.status === 'accepted'
        ? { next: 'ready', label: 'Tayyor' }
        : order.status === 'ready'
          ? { next: 'completed', label: 'Yakunlash' }
          : null;

  return (
    <div
      className="p-4 rounded-2xl border space-y-3"
      style={{ backgroundColor: 'var(--dx-surface)', borderColor: 'var(--dx-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold" style={{ color: 'var(--dx-muted)' }}>
            {order.orderNumber} · {order.customerName}
          </div>
          <div className="font-bold text-sm mt-0.5">
            {order.productName} ({order.quantity} ta)
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--dx-muted)' }}>
            {order.fulfillmentType === 'delivery'
              ? `🚚 ${order.deliveryAddress}`
              : '🛍️ Olib ketish'} · {order.customerPhone}
          </div>
        </div>
        <StatusChip status={order.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--dx-border)' }}>
        <div className="font-extrabold text-sm" style={{ color: 'var(--dx-primary)' }}>
          {formatSoM(order.totalPrice)}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {order.status !== 'cancelled' && order.status !== 'rejected' && (
            <button
              type="button"
              onClick={() => onTogglePay(order.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
              className="px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer"
              style={{
                backgroundColor:
                  order.paymentStatus === 'paid' ? 'var(--dx-tertiary-container)' : 'var(--dx-bg)',
                borderColor: 'var(--dx-border)',
                color:
                  order.paymentStatus === 'paid' ? 'var(--dx-on-tertiary-container)' : 'var(--dx-text)',
              }}
            >
              {order.paymentStatus === 'paid' ? '✅ To‘langan' : 'To‘lovni tasdiqlash'}
            </button>
          )}

          {nextStep && (
            <button
              type="button"
              onClick={() => onAdvance(nextStep.next)}
              className="px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--dx-primary)', color: 'var(--dx-on-primary)' }}
            >
              {nextStep.label}
            </button>
          )}

          {order.status === 'pending' && (
            <button
              type="button"
              onClick={() => onAdvance('rejected')}
              className="px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer"
              style={{ borderColor: 'var(--dx-error)', color: 'var(--dx-error)' }}
            >
              Rad etish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
