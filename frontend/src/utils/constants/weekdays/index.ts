import { dateTimeFormat } from '@/utils/format';

// Weekdays are numbered like the API: 1 is Monday and 7 is Sunday.
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

// 1 January 2024 was a Monday, so day numbers map straight onto it.
const weekdayNames = (weekday: 'long' | 'short'): Record<number, string> => {
  const names: Record<number, string> = {};
  for (const day of WEEKDAYS) {
    Object.defineProperty(names, day, {
      enumerable: true,
      get: () =>
        dateTimeFormat({ weekday, timeZone: 'UTC' }).format(
          new Date(Date.UTC(2024, 0, day))
        ),
    });
  }
  return names;
};

// Names follow the current language and are read when shown.
export const weekdayLabels = weekdayNames('long');

export const weekdayShortLabels = weekdayNames('short');

// "Mon, Wed, Fri"
export const formatWeekdays = (weekdays: number[]): string =>
  weekdays.map((day) => weekdayShortLabels[day]).join(', ');

// Today's weekday in the browser's time zone, in the same numbering.
export const todayWeekday = (): number => ((new Date().getDay() + 6) % 7) + 1;
