import type { BadgeTone } from '@/components/ui/Badge';
import { msg, t, translated } from '@/i18n';
import type {
  Gender,
  GymSubscriptionCycle,
  GymSubscriptionStatus,
  MembershipPlanType,
  MembershipStatus,
  PaymentMethod,
} from '@gym/shared/types';

export const paymentMethodLabels = translated<PaymentMethod>({
  cash: msg('Cash'),
  card: msg('Card'),
  bank_transfer: msg('Bank Transfer'),
  online: msg('Online'),
  balance: msg('Client Balance'),
});

export const paymentMethods = Object.keys(
  paymentMethodLabels
) as PaymentMethod[];

export const planTypeLabels = translated<MembershipPlanType>({
  monthly: msg('Monthly'),
  three_months: msg('3 Months'),
  six_months: msg('6 Months'),
  yearly: msg('Yearly'),
  visit_based: msg('Visit-based'),
  personal_training: msg('Personal Training'),
});

export const planTypes = Object.keys(planTypeLabels) as MembershipPlanType[];

export const genderLabels = translated<Gender>({
  male: msg('Men'),
  female: msg('Women'),
});

export const genders = Object.keys(genderLabels) as Gender[];

// Terms that make up the pricing grid, shortest first; a longer term is an offer.
export const planTerms = [
  {
    type: 'monthly',
    months: 1,
    get label() {
      return t('1 month');
    },
    days: 30,
  },
  {
    type: 'three_months',
    months: 3,
    get label() {
      return t('3 months');
    },
    days: 90,
  },
  {
    type: 'six_months',
    months: 6,
    get label() {
      return t('6 months');
    },
    days: 180,
  },
  {
    type: 'yearly',
    months: 12,
    get label() {
      return t('12 months');
    },
    days: 365,
  },
] as const satisfies readonly {
  type: MembershipPlanType;
  months: number;
  label: string;
  days: number;
}[];

export const weeklyVisitsLabel = (weeklyVisits: number): string =>
  weeklyVisits > 0 ? t('{{n}}x per week', { n: weeklyVisits }) : t('Unlimited');

export const membershipStatusLabels = translated<MembershipStatus>({
  pending: msg('Pending'),
  active: msg('Active'),
  upcoming: msg('Up next'),
  expired: msg('Finished'),
  cancelled: msg('Cancelled'),
});

export const membershipStatusTone: Record<MembershipStatus, BadgeTone> = {
  active: 'success',
  upcoming: 'info',
  expired: 'neutral',
  cancelled: 'neutral',
  pending: 'warning',
};

export const subscriptionStatusLabels = translated<GymSubscriptionStatus>({
  trialing: msg('Trialing'),
  active: msg('Active'),
  past_due: msg('Past due'),
  cancelled: msg('Cancelled'),
});

export const subscriptionStatusTone: Record<GymSubscriptionStatus, BadgeTone> =
  {
    trialing: 'warning',
    active: 'success',
    past_due: 'danger',
    cancelled: 'neutral',
  };

export const subscriptionCycleLabels = translated<GymSubscriptionCycle>({
  monthly: msg('Monthly'),
  yearly: msg('Yearly'),
});
