import type { Membership } from '@gym/shared/types';
import { formatDay } from '@/utils/format';
import { t } from '@/i18n';

const DAY_MS = 86_400_000;

// "Starts 5 Nov 2026, ends 5 Dec 2026 (queued after the current membership)."
export const describePeriod = (membership: Membership): string => {
  const dates = {
    start: formatDay(membership.startDate),
    end: formatDay(membership.endDate),
  };
  return membership.status === 'upcoming'
    ? t(
        'Starts {{start}}, ends {{end}} (queued after the current membership).',
        dates
      )
    : t('Starts {{start}}, ends {{end}}.', dates);
};

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const shiftDays = (date: string, days: number): string =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);

// Whole days from today to a YYYY-MM-DD date; negative when it is in the past.
export const daysUntil = (date: string): number =>
  Math.round(
    (new Date(`${date}T00:00:00Z`).getTime() -
      new Date(`${todayIso()}T00:00:00Z`).getTime()) /
      DAY_MS
  );

// Mirrors the server: a new membership starts the day after the last paid one ends.
export const nextStart = (
  memberships: Membership[]
): { date: string; queued: boolean } => {
  const today = todayIso();
  const lastEnd = memberships
    .filter((item) => item.status === 'active' || item.status === 'upcoming')
    .map((item) => item.endDate)
    .sort()
    .at(-1);
  return lastEnd && lastEnd >= today
    ? { date: shiftDays(lastEnd, 1), queued: true }
    : { date: today, queued: false };
};
