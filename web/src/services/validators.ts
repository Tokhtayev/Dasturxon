import {
  MAX_DISCOUNT_PERCENT,
  MIN_BUSINESS_ADDRESS_LENGTH,
  MIN_BUSINESS_NAME_LENGTH,
  MIN_FULL_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_PHONE_LENGTH,
  MIN_TYPE_NOTE_LENGTH,
  MAX_TYPE_NOTE_LENGTH,
} from './constants.ts';

const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const NICKNAME_REGEX = /^[a-z0-9_.]{3,20}$/;

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isStrongPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && /[A-Za-z]/.test(password) && /\d/.test(password);
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
  if (params.fullName.trim().length < MIN_FULL_NAME_LENGTH) {
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
      error: "Parol kamida 8 belgi, harf va raqamdan iborat bo'lishi kerak.",
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
  if (params.name.trim().length < MIN_BUSINESS_NAME_LENGTH) {
    return { valid: false, error: 'Biznes nomini kiriting.' };
  }
  if (params.type === 'other') {
    const len = params.typeNote.trim().length;
    if (len < MIN_TYPE_NOTE_LENGTH || len > MAX_TYPE_NOTE_LENGTH) {
      return { valid: false, error: 'Boshqa tur uchun 3–40 belgili izoh kiriting.' };
    }
  }
  if (params.address.trim().length < MIN_BUSINESS_ADDRESS_LENGTH) {
    return { valid: false, error: 'Biznes manzilini kiriting.' };
  }
  if (params.phone.trim().length < MIN_PHONE_LENGTH) {
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
  if (!params.name.trim()) {
    return { valid: false, error: 'Mahsulot nomini kiriting.' };
  }
  const price = Number(params.priceText);
  if (!Number.isInteger(price) || price <= 0) {
    return { valid: false, error: "Sotish narxi 0 dan katta butun son bo'lishi kerak." };
  }
  if (params.costPriceText.trim()) {
    const cost = Number(params.costPriceText);
    if (!Number.isInteger(cost) || cost < 0) {
      return { valid: false, error: "Tannarxi manfiy bo'lmasligi kerak." };
    }
  }
  if (params.stockText.trim()) {
    const stock = Number(params.stockText);
    if (!Number.isInteger(stock) || stock < 0) {
      return { valid: false, error: "Zaxira soni manfiy bo'lmasligi kerak." };
    }
  }
  const discount = params.discountText.trim() ? Number(params.discountText) : 0;
  if (!Number.isInteger(discount) || discount < 0 || discount > MAX_DISCOUNT_PERCENT) {
    return { valid: false, error: "Chegirma 0 dan 90 foizgacha bo'lishi kerak." };
  }
  return { valid: true };
}
