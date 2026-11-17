import { getLanguage, intlLocales } from '@/i18n';

// Weekdays are numbered like the API: 1 is Monday and 7 is Sunday.
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

// 1 January 2024 was a Monday, so day numbers map straight onto it.
export const weekdayName = (
  weekday: number,
  style: 'long' | 'short' | 'narrow'
): string =>
  new Intl.DateTimeFormat(intlLocales[getLanguage()], {
    weekday: style,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, 0, weekday)));

// Today's weekday in the phone's time zone, in the same numbering.
export const todayWeekday = (): number => ((new Date().getDay() + 6) % 7) + 1;
