import type { Membership, MembershipPlan } from '@gym/shared/types';
import { t } from '@/i18n';
import { formatDay } from '@/utils/format';
import { planTerms, weeklyVisitsLabel } from '@/utils/labels';

const DAY_MS = 86_400_000;

// What a member pays for the plan today: the offer price while an offer is valid.
export const planPrice = (plan: MembershipPlan): number =>
  plan.offer?.price ?? plan.price;

// "3x per week, 6 months" or "1 visit, valid 1 day".
export const describePlan = (plan: MembershipPlan): string => {
  if (plan.type === 'visit_based') {
    return t('{{visits}}, {{valid}}', {
      visits:
        plan.visitCount === 1
          ? t('1 visit')
          : t('{{n}} visits', { n: plan.visitCount }),
      valid:
        plan.durationDays === 1
          ? t('valid 1 day')
          : t('valid {{n}} days', { n: plan.durationDays }),
    });
  }
  const term = planTerms.find((item) => item.type === plan.type);
  return t('{{frequency}}, {{term}}', {
    frequency: weeklyVisitsLabel(plan.weeklyVisits),
    term:
      term?.label ??
      (plan.durationDays === 1
        ? t('1 day')
        : t('{{n}} days', { n: plan.durationDays })),
  });
};

// "5 Nov 2026 - 5 Dec 2026"
export const describePeriod = (membership: Membership): string =>
  `${formatDay(membership.startDate)} - ${formatDay(membership.endDate)}`;

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

// "Ends in 12 days", "Ends today", "Finished 3 days ago".
export const daysRemainingLabel = (endDate: string): string => {
  const days = daysUntil(endDate);
  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 1
      ? t('Finished 1 day ago')
      : t('Finished {{n}} days ago', { n: ago });
  }
  if (days === 0) return t('Ends today');
  return days === 1 ? t('Ends in 1 day') : t('Ends in {{n}} days', { n: days });
};

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

// The queue the member sees: running, waiting and unpaid memberships, soonest first.
export const queueOf = (memberships: Membership[]): Membership[] =>
  memberships
    .filter((item) => ['active', 'upcoming', 'pending'].includes(item.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

// What the member is told after a purchase: the dates are the ones the server decided.
export const subscriptionMessage = (membership: Membership): string =>
  t('You are subscribed: {{plan}}. Starts {{start}} and ends {{end}}.', {
    plan: membership.planName,
    start: formatDay(membership.startDate),
    end: formatDay(membership.endDate),
  });
