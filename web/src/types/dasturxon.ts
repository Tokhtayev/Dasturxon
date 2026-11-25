export type BusinessTypeKey =
  | 'bakery'
  | 'confectionery'
  | 'pastry'
  | 'teahouse'
  | 'kitchen'
  | 'cafe'
  | 'other';

export interface BusinessTypeMeta {
  storedValue: BusinessTypeKey;
  labelUz: string;
  labelRu: string;
  labelEn: string;
  icon: string;
  sortOrder: number;
}

export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  type: BusinessTypeKey;
  address: string;
  phone: string;
  status: BusinessStatus;
  rejectionReason?: string;
  typeNote?: string;
  telegramHandle?: string;
}

export type ProductStatus = 'available' | 'hot_ready' | 'sold_out';

export interface Product {
  id: string;
  businessId: string;
  businessName: string;
  businessType: BusinessTypeKey;
  businessAddress: string;
  businessPhone: string;
  name: string;
  description: string;
  price: number;
  costPrice: number; // Private: visible only in Owner mode (products/{id}/private/cost)
  status: ProductStatus;
  stock: number | null;
  discountPercent: number;
  discountEndsAt: number | null; // epoch ms
  published: boolean;
  imageUrl: string;
}

export type OrderStatusKey =
  | 'pending'
  | 'accepted'
  | 'ready'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';
export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderLineItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitCost?: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  businessId: string;
  businessName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatusKey;
  paymentStatus: PaymentStatus;
  fulfillmentType: FulfillmentType;
  deliveryAddress: string;
  pickupTime: number;
  createdAt: number;
  paidAt?: number;
  items?: OrderLineItem[];
}

export interface Expense {
  id: string;
  businessId: string;
  title: string;
  amount: number;
  category: string;
  createdAt: number;
}

export interface PromoBanner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  badge: string;
  businessName: string;
  targetCategory: BusinessTypeKey;
  gradient: string;
  imageUrl: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  icon: string;
  isRead: boolean;
  targetTab: 'home' | 'shops' | 'orders' | 'profile';
}

export type AppRole = 'customer' | 'owner' | 'admin';
export type LanguageCode = 'uz' | 'ru' | 'en';
