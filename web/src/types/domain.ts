export type UserRole = 'customer' | 'owner' | 'admin';

export type RegisterableRole = 'customer' | 'owner';

export interface UserProfile {
  uid: string;
  fullName: string;
  normalizedNickname: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAtMs: number;
}

export type LoginMethod = 'email' | 'google';

export type LoginEmailDeliveryStatus =
  'sending' | 'sent' | 'skipped_test_domain' | 'not_configured' | 'failed';

export interface LoginNotice {
  email: string;
  role: UserRole;
  fullName: string;
  method: LoginMethod;
  emailStatus: LoginEmailDeliveryStatus;
  timestampMs: number;
}

export type AuthSessionState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'ready'; profile: UserProfile }
  | { status: 'profile_missing'; uid: string; email: string; displayName?: string }
  | { status: 'error'; message: string };

export type BusinessTypeKey =
  'bakery' | 'confectionery' | 'pastry' | 'teahouse' | 'kitchen' | 'cafe' | 'other';

export interface BusinessTypeMeta {
  storedValue: BusinessTypeKey;
  labelUz: string;
  icon: string;
}

export const BUSINESS_TYPES: BusinessTypeMeta[] = [
  { storedValue: 'bakery', labelUz: 'Nonvoyxona', icon: '🥖' },
  { storedValue: 'confectionery', labelUz: 'Qandolatxona', icon: '🍬' },
  { storedValue: 'pastry', labelUz: 'Pishiriq', icon: '🍰' },
  { storedValue: 'teahouse', labelUz: 'Choyxona', icon: '🍵' },
  { storedValue: 'kitchen', labelUz: 'Oshxona', icon: '🍲' },
  { storedValue: 'cafe', labelUz: 'Kafe', icon: '☕' },
  { storedValue: 'other', labelUz: 'Boshqa', icon: '🍽️' },
];

export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type LegalFormKey = 'mchj' | 'yatt';

export const LEGAL_FORMS: { storedValue: LegalFormKey; labelUz: string; hint: string }[] = [
  { storedValue: 'mchj', labelUz: 'MChJ', hint: 'Mas’uliyati cheklangan jamiyat' },
  { storedValue: 'yatt', labelUz: 'YaTT', hint: 'Yakka tartibdagi tadbirkor' },
];

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  type: BusinessTypeKey;
  legalForm?: LegalFormKey;
  address: string;
  phone: string;
  status: BusinessStatus;
  typeNote?: string;
  activitySummary?: string;
  productsSummary?: string;
  adminNote?: string;
  rejectionReason?: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export type InquiryStatus = 'waiting' | 'replied' | 'registered';

export interface OwnerInquiry {
  id: string;
  ownerName: string;
  phone: string;
  email?: string;
  ownerUid?: string;
  legalForm: LegalFormKey;
  businessType?: BusinessTypeKey;
  businessName?: string;
  address?: string;
  activitySummary: string;
  productsSummary: string;
  status: InquiryStatus;
  adminReply?: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export type ProductStatus = 'available' | 'hot_ready' | 'sold_out';

export interface Product {
  id: string;
  businessId: string;
  businessName: string;
  businessType: BusinessTypeKey;
  businessAddress: string;
  businessPhone: string;
  category: BusinessTypeKey;
  name: string;
  description: string;
  price: number;
  costPrice: number; // Strictly stored in products/{id}/private/cost (owner/admin only)
  published: boolean;
  status: ProductStatus;
  stock: number | null;
  discountPercent: number;
  discountEndsAtMs: number | null;
  imageUrl: string;
  updatedAtMs: number;
  wholesaleEnabled?: boolean;
  wholesaleOnly?: boolean;
  wholesaleMinQty?: number | null;
  wholesalePrice?: number | null;
}

export type OrderType = 'retail' | 'wholesale';

export type OrderStatusKey =
  'pending' | 'accepted' | 'ready' | 'completed' | 'rejected' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';
export type PrepaymentStatus = 'awaiting_advance' | 'advance_submitted' | 'advance_paid';
export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderLineItem {
  id?: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitCost?: number;
}

export interface CustomerOrder {
  id: string;
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
  pickupTimeMs: number;
  createdAtMs: number;
  updatedAtMs: number;
  paidAtMs?: number;
  receiptUrl?: string;
  receiptUploadedAtMs?: number;
  prepaymentPercent?: number;
  prepaymentAmount?: number;
  prepaymentStatus?: PrepaymentStatus;
  advanceReceiptUrl?: string;
  advanceUploadedAtMs?: number;
  advanceVerifiedAtMs?: number;
  orderType?: OrderType;
}

export interface Expense {
  id: string;
  businessId: string;
  title: string;
  amount: number;
  category: string;
  createdAtMs: number;
}
