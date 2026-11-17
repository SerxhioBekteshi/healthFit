import type { CurrencyCode } from '@gym/shared/types';
import { getLanguage, intlLocales } from '@/i18n';

// The locale of the current language, for dates and numbers.
const currentLocale = (): string => intlLocales[getLanguage()];

const dateFormat = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(currentLocale(), options);

// Fractions only show when the number has them.
export const formatAmount = (amount: number): string =>
  new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 2 }).format(
    amount
  );

// Amounts show in the gym's currency and are never converted.
export const formatMoney = (
  amount: number,
  currency: CurrencyCode | null
): string => {
  if (currency === null) return formatAmount(amount);
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
  dateFormat({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

// "Thu, 5 Nov" for a moment in time.
export const formatShortDate = (iso: string): string =>
  dateFormat({ weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(iso)
  );

export const formatTime = (iso: string): string =>
  dateFormat({ hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const formatDateTime = (iso: string): string =>
  `${formatShortDate(iso)}, ${formatTime(iso)}`;

// "2026-11" -> "November 2026"
export const formatMonth = (month: string): string =>
  dateFormat({ month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T00:00:00Z`)
  );

// "2026-11-05" -> "Thursday, 5 November"
export const formatLongDay = (date: string): string =>
  dateFormat({
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

// 95 minutes -> "1 h 35 min"
export const formatDuration = (fromIso: string, toIso: string): string => {
  const minutes = Math.max(
    Math.round(
      (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60_000
    ),
    0
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
};

// The phone's own calendar date as YYYY-MM-DD, for a date picker that is not tied to the gym.
export const localToday = (): string => {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const firstName = (fullName: string): string =>
  fullName.trim().split(/\s+/)[0] ?? fullName;

export const initials = (fullName: string): string =>
  fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
