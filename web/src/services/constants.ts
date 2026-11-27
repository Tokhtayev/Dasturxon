import type { BusinessTypeKey, OrderStatusKey, ProductStatus } from '../types/domain';

export const MIN_FULL_NAME_LENGTH = 2;
export const MAX_FULL_NAME_LENGTH = 100;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_EMAIL_LENGTH = 254;

export const MIN_BUSINESS_NAME_LENGTH = 2;
export const MAX_BUSINESS_NAME_LENGTH = 100;
export const MIN_BUSINESS_ADDRESS_LENGTH = 4;
export const MAX_BUSINESS_ADDRESS_LENGTH = 160;
export const MIN_PHONE_LENGTH = 7;
export const MAX_PHONE_LENGTH = 30;
export const MIN_TYPE_NOTE_LENGTH = 3;
export const MAX_TYPE_NOTE_LENGTH = 40;
export const MIN_REJECTION_REASON_LENGTH = 3;
export const MAX_REJECTION_REASON_LENGTH = 300;
export const MIN_SUMMARY_LENGTH = 3;
export const MAX_BUSINESS_SUMMARY_LENGTH = 400;
export const MAX_ADMIN_NOTE_LENGTH = 400;
export const ADMIN_SUPPORT_PHONE = '+998 90 123 45 67';
export const DEFAULT_LOGIN_EMAIL_WEBHOOK_URL = (
  import.meta.env.VITE_LOGIN_EMAIL_WEBHOOK_URL ?? ''
).trim();
export const MAX_WEBHOOK_URL_LENGTH = 300;
export const USER_AGENT_TRUNCATE_LEN = 120;
export const MIN_NICKNAME_LENGTH = 3;
export const MAX_NICKNAME_LENGTH = 20;
export const NICKNAME_UID_SUFFIX_LEN = 4;
export const NICKNAME_FALLBACK_UID_LEN = 12;

export const MAX_PRODUCT_NAME_LENGTH = 100;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 400;
export const MAX_PRICE_SOM = 100_000_000;
export const MAX_STOCK_COUNT = 100_000;
export const MAX_DISCOUNT_PERCENT = 90;

export const MIN_ORDER_QUANTITY = 1;
export const MAX_ORDER_QUANTITY = 99;
export const MAX_DELIVERY_ADDRESS_LENGTH = 200;

export const MIN_EXPENSE_TITLE_LENGTH = 2;
export const MAX_EXPENSE_TITLE_LENGTH = 80;

export const REGISTRATION_PROFILE_DEBOUNCE_MS = 1500;
export const TASHKENT_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;
export const MS_PER_DAY = 86_400_000;
export const MS_PER_MINUTE = 60_000;
export const MINUTES_PER_HOUR = 60;
export const DAYS_IN_WEEK = 7;
export const PERCENT_DIVISOR = 100;
export const FIRESTORE_IN_CHUNK_SIZE = 10;
export const MILLIS_TO_THOUSANDS = 1000;
export const LOW_STOCK_THRESHOLD = 5;

export const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION_PX = 800;
export const IMAGE_JPEG_QUALITY = 0.7;
export const IMAGE_FALLBACK_QUALITY = 0.55;
export const MAX_IMAGE_DATA_URL_LENGTH = 700_000;
export const MIN_IMAGE_DIMENSION = 1;
export const BYTES_PER_KILOBYTE = 1024;

export const ACTIVE_PRODUCT_STATUSES: readonly ProductStatus[] = ['available', 'hot_ready'];
export const TERMINAL_ORDER_STATUSES: readonly OrderStatusKey[] = [
  'completed',
  'rejected',
  'cancelled',
];
export const IN_PROGRESS_ORDER_STATUSES: readonly OrderStatusKey[] = [
  'pending',
  'accepted',
  'ready',
];

export const EXPENSE_CATEGORIES = ['Xomashyo', 'Kommunal', 'Ish haqi', 'Boshqa'] as const;

export const BUSINESS_TYPE_VISUALS: Record<BusinessTypeKey, { icon: string; gradient: string }> = {
  bakery: { icon: '🥖', gradient: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)' },
  confectionery: { icon: '🍬', gradient: 'linear-gradient(135deg, #6B1736 0%, #B8426B 100%)' },
  pastry: { icon: '🍰', gradient: 'linear-gradient(135deg, #7A3803 0%, #C66D28 100%)' },
  teahouse: { icon: '🍵', gradient: 'linear-gradient(135deg, #0F7C84 0%, #3E9BA2 100%)' },
  kitchen: { icon: '🍲', gradient: 'linear-gradient(135deg, #1E3A2F 0%, #4C7A2B 100%)' },
  cafe: { icon: '☕', gradient: 'linear-gradient(135deg, #4E342E 0%, #8D6E63 100%)' },
  other: { icon: '🍽️', gradient: 'linear-gradient(135deg, #5D4037 0%, #B7500A 100%)' },
};
