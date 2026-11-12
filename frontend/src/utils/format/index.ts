import { getCurrency, getLanguage, intlLocales } from '@/i18n';

// The locale of the current language, for dates and numbers.
export const currentLocale = (): string => intlLocales[getLanguage()];

export const dateTimeFormat = (
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat => new Intl.DateTimeFormat(currentLocale(), options);

// Fractions only show when the number has them.
export const formatAmount = (amount: number): string =>
  new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 2 }).format(
    amount
  );

// The currency follows the gym's country (ALL, EUR or GBP); stored prices are not converted.
export const formatMoney = (amount: number): string => {
  const currency = getCurrency();
  if (currency === 'ALL') return `${formatAmount(amount)} ALL`;
  return new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// YYYY-MM-DD from the API, shown as "5 Nov 2026".
export const formatDay = (date: string): string =>
  dateTimeFormat({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(currentLocale());

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(currentLocale());

export const formatTime = (iso: string): string =>
  dateTimeFormat({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
