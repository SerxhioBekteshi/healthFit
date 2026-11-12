import type { CardBrand } from '@gym/shared/types';
import { t } from '@/i18n';

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

// Visa starts with 4; Mastercard with 51-55 or 2221-2720.
export const detectBrand = (digits: string): CardBrand | null => {
  if (digits.startsWith('4')) return 'visa';
  if (/^(?:5[1-5]|2(?:22[1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720))/.test(digits)) {
    return 'mastercard';
  }
  return null;
};

export const passesLuhn = (digits: string): boolean => {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return digits.length > 0 && sum % 10 === 0;
};

export const formatCardNumber = (value: string): string =>
  digitsOnly(value)
    .slice(0, 16)
    .replace(/(.{4})(?=.)/g, '$1 ');

// "1228" -> "12/28"; the slash appears as soon as the month is complete.
export const formatExpiry = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
};

export interface CardInput {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
}

export type CardErrors = Partial<Record<keyof CardInput, string>>;

// A card is valid through the last day of its expiry month.
const isExpired = (month: number, year: number, now: Date): boolean =>
  new Date(2000 + year, month, 1).getTime() <= now.getTime();

export const validateCard = (
  input: CardInput,
  now: Date = new Date()
): CardErrors => {
  const errors: CardErrors = {};
  const number = digitsOnly(input.number);

  if (input.name.trim().length < 2) {
    errors.name = t('Enter the name on the card.');
  }

  if (!detectBrand(number)) {
    errors.number = t('Only Visa and Mastercard are accepted.');
  } else if (number.length !== 16 || !passesLuhn(number)) {
    errors.number = t('Check the card number.');
  }

  const [monthText = '', yearText = ''] = input.expiry.split('/');
  const month = Number(monthText);
  const year = Number(yearText);
  if (
    monthText.length !== 2 ||
    yearText.length !== 2 ||
    month < 1 ||
    month > 12
  ) {
    errors.expiry = t('Use MM/YY.');
  } else if (isExpired(month, year, now)) {
    errors.expiry = t('This card has expired.');
  }

  if (!/^\d{3}$/.test(input.cvc)) {
    errors.cvc = t('3 digits.');
  }

  return errors;
};
