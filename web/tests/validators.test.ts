import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_DATA_URL_LENGTH } from '../src/services/constants';
import { getReadableErrorMessage, redactSensitiveTokens } from '../src/services/errors';
import {
  escapeHtml,
  formatContactPhoneDisplay,
  isStrongPassword,
  isValidContactPhone,
  isValidEmail,
  isValidNickname,
  normalizeNickname,
  sanitizeImageUrl,
  sanitizeUserText,
  validateBusinessForm,
  validateExpenseInput,
  validateProductForm,
  validateRejectionReason,
  validateSignUpForm,
} from '../src/services/validators';

describe('validators & text sanitization', () => {
  it('isValidEmail handles valid addresses, empty strings, whitespace, and oversized input', () => {
    expect(isValidEmail('ali@dasturxon.uz')).toBe(true);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail(`${'a'.repeat(250)}@b.uz`)).toBe(false);
  });

  it('isStrongPassword checks 7/8/128/129 length boundaries and letter+digit rules', () => {
    expect(isStrongPassword('')).toBe(false);
    expect(isStrongPassword('Pass123')).toBe(false);
    expect(isStrongPassword('Pass1234')).toBe(true);
    expect(isStrongPassword('OnlyLettersHere')).toBe(false);
    expect(isStrongPassword('12345678')).toBe(false);
    expect(isStrongPassword(`A1${'x'.repeat(126)}`)).toBe(true);
    expect(isStrongPassword(`A1${'x'.repeat(127)}`)).toBe(false);
  });

  it('validateSignUpForm enforces fullName, nickname, email, and confirmPassword match', () => {
    expect(normalizeNickname('  Ali_Bek ')).toBe('ali_bek');
    expect(isValidNickname('ali_bek99')).toBe(true);
    expect(isValidNickname('ab')).toBe(false);
    expect(
      validateSignUpForm({
        fullName: 'Ali Valiyev',
        nickname: 'ali_bek',
        email: 'ali@example.com',
        password: 'Password1',
        confirmPassword: 'Password1',
      }).valid
    ).toBe(true);
    expect(
      validateSignUpForm({
        fullName: ' ',
        nickname: 'ali_bek',
        email: 'ali@example.com',
        password: 'Password1',
        confirmPassword: 'Password1',
      }).valid
    ).toBe(false);
    expect(
      validateSignUpForm({
        fullName: 'Ali',
        nickname: 'ali_bek',
        email: 'ali@example.com',
        password: 'Password1',
        confirmPassword: 'Password2',
      }).valid
    ).toBe(false);
  });

  it('validateBusinessForm enforces required fields and typeNote 3..40 bounds', () => {
    expect(
      validateBusinessForm({
        name: 'Baraka',
        type: 'bakery',
        typeNote: '',
        address: 'Yunusobod 4',
        phone: '+998901234567',
      }).valid
    ).toBe(true);
    expect(
      validateBusinessForm({
        name: '',
        type: 'bakery',
        typeNote: '',
        address: 'Yunusobod 4',
        phone: '+998901234567',
      }).valid
    ).toBe(false);
    expect(
      validateBusinessForm({
        name: 'Baraka',
        type: 'other',
        typeNote: 'ab',
        address: 'Yunusobod 4',
        phone: '+998901234567',
      }).valid
    ).toBe(false);
  });

  it('validateProductForm enforces price > 0, stock >= 0, and discount 0..90 boundaries', () => {
    expect(
      validateProductForm({
        name: 'Tandir non',
        priceText: '1',
        costPriceText: '0',
        stockText: '0',
        discountText: '90',
      }).valid
    ).toBe(true);
    expect(
      validateProductForm({
        name: 'Tandir non',
        priceText: '0',
        costPriceText: '0',
        stockText: '10',
        discountText: '0',
      }).valid
    ).toBe(false);
    expect(
      validateProductForm({
        name: 'Tandir non',
        priceText: '-5000',
        costPriceText: '0',
        stockText: '10',
        discountText: '0',
      }).valid
    ).toBe(false);
    expect(
      validateProductForm({
        name: 'Tandir non',
        priceText: '5000',
        costPriceText: '-1',
        stockText: '10',
        discountText: '0',
      }).valid
    ).toBe(false);
    expect(
      validateProductForm({
        name: 'Tandir non',
        priceText: '5000',
        costPriceText: '2000',
        stockText: '-1',
        discountText: '0',
      }).valid
    ).toBe(false);
    expect(
      validateProductForm({
        name: 'Tandir non',
        priceText: '5000',
        costPriceText: '2000',
        stockText: '5',
        discountText: '91',
      }).valid
    ).toBe(false);
  });

  it('validateExpenseInput and validateRejectionReason reject empty or invalid inputs', () => {
    expect(validateExpenseInput({ title: '', amount: 5000, category: 'Xomashyo' }).valid).toBe(
      false
    );
    expect(validateExpenseInput({ title: 'Un', amount: 0, category: 'Xomashyo' }).valid).toBe(
      false
    );
    expect(validateExpenseInput({ title: 'Un', amount: -100, category: 'Xomashyo' }).valid).toBe(
      false
    );
    expect(validateExpenseInput({ title: 'Un', amount: 15000, category: 'Xomashyo' }).valid).toBe(
      true
    );
    expect(validateRejectionReason('  ').valid).toBe(false);
    expect(validateRejectionReason('ab').valid).toBe(false);
    expect(validateRejectionReason('Manzil noaniq').valid).toBe(true);
  });

  it('sanitizeUserText, escapeHtml, and redactSensitiveTokens protect against injection and token leaks', () => {
    expect(sanitizeUserText('  <script>alert(1)</script>Non\u0000\n ')).toBe(
      'scriptalert(1)/scriptNon'
    );
    expect(escapeHtml('<b title="x">O\'z</b> &')).toBe(
      '&lt;b title=&quot;x&quot;&gt;O&#39;z&lt;/b&gt; &amp;'
    );

    const raw =
      'Failed for key=AIzaSyDummySecretValue12345 Bearer abc.def.ghi token=secret123 eyJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIxIn0.sig';
    const masked = redactSensitiveTokens(raw);
    expect(masked).not.toContain('AIzaSyDummySecretValue12345');
    expect(masked).not.toContain('abc.def.ghi');
    expect(masked).not.toContain('secret123');
    expect(masked).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(getReadableErrorMessage(new Error('Bearer tok123456'), 'Fallback')).toBe(
      'Bearer [REDACTED]'
    );
  });

  it('sanitizeImageUrl allows empty, https, and bounded base64 data URLs while rejecting unsafe or oversized values', () => {
    expect(sanitizeImageUrl(undefined)).toBe('');
    expect(sanitizeImageUrl('   ')).toBe('');
    expect(sanitizeImageUrl(' https://example.com/chek.jpg ')).toBe('https://example.com/chek.jpg');
    expect(sanitizeImageUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe(
      'data:image/jpeg;base64,/9j/4AAQ'
    );
    expect(() => sanitizeImageUrl('http://example.com/chek.jpg')).toThrow('Rasm formati');
    expect(() => sanitizeImageUrl('data:text/html;base64,PGgxPg==')).toThrow('Rasm formati');
    expect(() =>
      sanitizeImageUrl(`data:image/jpeg;base64,${'A'.repeat(MAX_IMAGE_DATA_URL_LENGTH)}`)
    ).toThrow('limitidan');
  });

  it('isValidContactPhone and formatContactPhoneDisplay reject bare +998 prefixes and keep valid phones', () => {
    expect(isValidContactPhone('+998')).toBe(false);
    expect(isValidContactPhone('+998 ')).toBe(false);
    expect(isValidContactPhone('')).toBe(false);
    expect(isValidContactPhone('+998 90 123 45 67')).toBe(true);
    expect(formatContactPhoneDisplay('+998')).toBe('');
    expect(formatContactPhoneDisplay('+998 90 123 45 67')).toBe('+998 90 123 45 67');
  });
});
