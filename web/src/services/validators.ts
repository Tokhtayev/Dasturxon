import {
  MAX_BUSINESS_ADDRESS_LENGTH,
  MAX_BUSINESS_NAME_LENGTH,
  MAX_BUSINESS_SUMMARY_LENGTH,
  MAX_DELIVERY_ADDRESS_LENGTH,
  MAX_DISCOUNT_PERCENT,
  MAX_EMAIL_LENGTH,
  MAX_EXPENSE_TITLE_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_IMAGE_DATA_URL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_PRICE_SOM,
  MAX_PRODUCT_DESCRIPTION_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
  MAX_STOCK_COUNT,
  MAX_TYPE_NOTE_LENGTH,
  MIN_BUSINESS_ADDRESS_LENGTH,
  MIN_BUSINESS_NAME_LENGTH,
  MIN_EXPENSE_TITLE_LENGTH,
  MIN_FULL_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_PHONE_LENGTH,
  MIN_REJECTION_REASON_LENGTH,
  MIN_SUMMARY_LENGTH,
  MIN_TYPE_NOTE_LENGTH,
} from './constants.ts';

const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const NICKNAME_REGEX = /^[a-z0-9_.]{3,20}$/;
const ASCII_SPACE_CODE = 32;
const ASCII_DEL_CODE = 127;
const BIDI_RANGE_START = 0x202a;
const BIDI_RANGE_END = 0x202e;
const BIDI_ISOLATE_START = 0x2066;
const BIDI_ISOLATE_END = 0x2069;

function stripControlAndHtmlChars(raw: string): string {
  let out = '';
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    const isCtrl = code < ASCII_SPACE_CODE || code === ASCII_DEL_CODE;
    const isBidi =
      (code >= BIDI_RANGE_START && code <= BIDI_RANGE_END) ||
      (code >= BIDI_ISOLATE_START && code <= BIDI_ISOLATE_END);
    if (!isCtrl && !isBidi && ch !== '<' && ch !== '>') {
      out += ch;
    }
  }
  return out;
}

/** Normalizes and strips control characters and HTML angle brackets from user-supplied text. */
export function sanitizeUserText(raw: string, maxLength = MAX_PRODUCT_DESCRIPTION_LENGTH): string {
  const cleaned = stripControlAndHtmlChars(raw).trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength).trim() : cleaned;
}

/** Escapes special HTML characters for any non-JSX rendering boundary. */
export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(trimmed);
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export function isValidNickname(raw: string): boolean {
  return NICKNAME_REGEX.test(normalizeNickname(raw));
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSignUpForm(params: {
  fullName: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const cleanName = sanitizeUserText(params.fullName, MAX_FULL_NAME_LENGTH);
  if (cleanName.length < MIN_FULL_NAME_LENGTH) {
    return { valid: false, error: "To'liq ism kamida 2 ta belgidan iborat bo'lsin." };
  }
  if (!isValidNickname(params.nickname)) {
    return {
      valid: false,
      error: "Nickname 3–20 belgi, faqat kichik harf (a-z), raqam, '_' va '.' dan iborat bo'lsin.",
    };
  }
  if (!isValidEmail(params.email)) {
    return { valid: false, error: "Email manzili formati noto'g'ri." };
  }
  if (!isStrongPassword(params.password)) {
    return {
      valid: false,
      error: "Parol 8–128 belgi, harf va raqamdan iborat bo'lishi kerak.",
    };
  }
  if (params.password !== params.confirmPassword) {
    return { valid: false, error: 'Parollar bir-biriga mos emas.' };
  }
  return { valid: true };
}

export function validateBusinessForm(params: {
  name: string;
  type: string;
  typeNote: string;
  address: string;
  phone: string;
}): ValidationResult {
  const cleanName = sanitizeUserText(params.name, MAX_BUSINESS_NAME_LENGTH);
  const cleanAddr = sanitizeUserText(params.address, MAX_BUSINESS_ADDRESS_LENGTH);
  const cleanPhone = sanitizeUserText(params.phone, MAX_PHONE_LENGTH);
  if (cleanName.length < MIN_BUSINESS_NAME_LENGTH) {
    return { valid: false, error: 'Biznes nomini kiriting.' };
  }
  if (params.type === 'other') {
    const len = sanitizeUserText(params.typeNote, MAX_TYPE_NOTE_LENGTH).length;
    if (len < MIN_TYPE_NOTE_LENGTH || len > MAX_TYPE_NOTE_LENGTH) {
      return { valid: false, error: 'Boshqa tur uchun 3–40 belgili izoh kiriting.' };
    }
  }
  if (cleanAddr.length < MIN_BUSINESS_ADDRESS_LENGTH) {
    return { valid: false, error: 'Biznes manzilini kiriting.' };
  }
  if (cleanPhone.length < MIN_PHONE_LENGTH) {
    return { valid: false, error: 'Telefon raqamini kiriting.' };
  }
  return { valid: true };
}

export function validateProductForm(params: {
  name: string;
  priceText: string;
  costPriceText: string;
  stockText: string;
  discountText: string;
}): ValidationResult {
  if (!sanitizeUserText(params.name, MAX_PRODUCT_NAME_LENGTH)) {
    return { valid: false, error: 'Mahsulot nomini kiriting.' };
  }
  const price = Number(params.priceText);
  if (!Number.isInteger(price) || price <= 0 || price > MAX_PRICE_SOM) {
    return { valid: false, error: "Sotish narxi 0 dan katta butun son bo'lishi kerak." };
  }
  if (params.costPriceText.trim()) {
    const cost = Number(params.costPriceText);
    if (!Number.isInteger(cost) || cost < 0 || cost > MAX_PRICE_SOM) {
      return { valid: false, error: "Tannarxi manfiy bo'lmasligi kerak." };
    }
  }
  if (params.stockText.trim()) {
    const stock = Number(params.stockText);
    if (!Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK_COUNT) {
      return { valid: false, error: "Zaxira soni manfiy bo'lmasligi kerak." };
    }
  }
  const discount = params.discountText.trim() ? Number(params.discountText) : 0;
  if (!Number.isInteger(discount) || discount < 0 || discount > MAX_DISCOUNT_PERCENT) {
    return { valid: false, error: "Chegirma 0 dan 90 foizgacha bo'lishi kerak." };
  }
  return { valid: true };
}

export function validateExpenseInput(params: {
  title: string;
  amount: number;
  category: string;
}): ValidationResult {
  const cleanTitle = sanitizeUserText(params.title, MAX_EXPENSE_TITLE_LENGTH);
  if (cleanTitle.length < MIN_EXPENSE_TITLE_LENGTH) {
    return { valid: false, error: "Xarajat nomi kamida 2 belgidan iborat bo'lsin." };
  }
  if (
    !Number.isInteger(Math.round(params.amount)) ||
    params.amount <= 0 ||
    params.amount > MAX_PRICE_SOM
  ) {
    return { valid: false, error: "Xarajat summasi 0 dan katta son bo'lishi kerak." };
  }
  if (!sanitizeUserText(params.category, MAX_TYPE_NOTE_LENGTH)) {
    return { valid: false, error: 'Xarajat toifasini tanlang.' };
  }
  return { valid: true };
}

export function validateRejectionReason(reason: string): ValidationResult {
  const clean = sanitizeUserText(reason, MAX_REJECTION_REASON_LENGTH);
  if (clean.length < MIN_REJECTION_REASON_LENGTH) {
    return { valid: false, error: "Rad etish sababi kamida 3 belgidan iborat bo'lsin." };
  }
  return { valid: true };
}

export function sanitizeDeliveryAddress(address: string): string {
  return sanitizeUserText(address, MAX_DELIVERY_ADDRESS_LENGTH);
}

/** Checks that a contact phone contains at least MIN_PHONE_LENGTH digits (not just a '+998' prefix). */
export function isValidContactPhone(raw: string | undefined): boolean {
  const clean = sanitizeUserText(raw ?? '', MAX_PHONE_LENGTH);
  const digitsCount = clean.replace(/\D/g, '').length;
  return digitsCount >= MIN_PHONE_LENGTH;
}

/** Returns a formatted phone string when valid, or empty string for incomplete legacy values like '+998'. */
export function formatContactPhoneDisplay(raw: string | undefined): string {
  const clean = sanitizeUserText(raw ?? '', MAX_PHONE_LENGTH);
  return isValidContactPhone(clean) ? clean : '';
}

/** Builds a safe tel: URI from a phone number string. */
export function buildTelHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : '#';
}

/** Builds a prefilled sms: URI to start an SMS conversation cleanly. */
export function buildSmsHref(phone: string, body?: string): string {
  const normalized = phone.replace(/[^\d+]/g, '');
  if (!normalized) return '#';
  return body ? `sms:${normalized}?body=${encodeURIComponent(body)}` : `sms:${normalized}`;
}

export function validateOwnerInquiry(params: {
  ownerName: string;
  phone: string;
  legalForm: string;
  activitySummary: string;
  productsSummary: string;
}): ValidationResult {
  const cleanName = sanitizeUserText(params.ownerName, MAX_FULL_NAME_LENGTH);
  if (cleanName.length < MIN_FULL_NAME_LENGTH) {
    return { valid: false, error: 'Ismingizni kiriting (kamida 2 belgi).' };
  }
  if (!isValidContactPhone(params.phone)) {
    return { valid: false, error: 'Aloqa uchun to‘g‘ri telefon raqamini kiriting.' };
  }
  if (params.legalForm !== 'mchj' && params.legalForm !== 'yatt') {
    return { valid: false, error: 'Tashkiliy shaklni tanlang: MChJ yoki YaTT.' };
  }
  if (
    sanitizeUserText(params.activitySummary, MAX_BUSINESS_SUMMARY_LENGTH).length <
    MIN_SUMMARY_LENGTH
  ) {
    return { valid: false, error: 'Faoliyatingiz haqida qisqacha ma’lumot yozing.' };
  }
  if (
    sanitizeUserText(params.productsSummary, MAX_BUSINESS_SUMMARY_LENGTH).length <
    MIN_SUMMARY_LENGTH
  ) {
    return { valid: false, error: 'Mahsulotlaringiz haqida qisqacha ma’lumot yozing.' };
  }
  return { valid: true };
}

/** Validates and normalizes an optional data:image/* or https:// image URL within Firestore size caps. */
export function sanitizeImageUrl(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('data:image/') && !trimmed.startsWith('https://')) {
    throw new Error("Rasm formati noto'g'ri.");
  }
  if (trimmed.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error('Rasm hajmi Firestore hujjat limitidan oshmasligi kerak.');
  }
  return trimmed;
}
