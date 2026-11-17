import type { BadgeTone } from '@/components/ui/Badge';
import { msg, t, translated } from '@/i18n';
import type {
  BalanceTransactionType,
  MembershipPlanType,
  MembershipStatus,
  PaymentMethod,
  WorkoutLevel,
} from '@gym/shared/types';

export const planTypeLabels = translated<MembershipPlanType>({
  monthly: msg('Monthly'),
  three_months: msg('3 Months'),
  six_months: msg('6 Months'),
  yearly: msg('Yearly'),
  visit_based: msg('Visit-based'),
  personal_training: msg('Personal Training'),
});

// Terms that make up the price list, shortest first; a longer term is a discount.
export const planTerms = [
  {
    type: 'monthly',
    months: 1,
    get label() {
      return t('1 month');
    },
  },
  {
    type: 'three_months',
    months: 3,
    get label() {
      return t('3 months');
    },
  },
  {
    type: 'six_months',
    months: 6,
    get label() {
      return t('6 months');
    },
  },
  {
    type: 'yearly',
    months: 12,
    get label() {
      return t('12 months');
    },
  },
] as const satisfies readonly {
  type: MembershipPlanType;
  months: number;
  label: string;
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

export const paymentMethodLabels = translated<PaymentMethod>({
  cash: msg('Cash'),
  card: msg('Card'),
  bank_transfer: msg('Bank transfer'),
  online: msg('Online'),
  balance: msg('Balance'),
});

export const transactionTypeLabels = translated<BalanceTransactionType>({
  deposit: msg('Top-up'),
  purchase: msg('Purchase'),
  membership: msg('Membership'),
  refund: msg('Refund'),
});

export const workoutLevelLabels = translated<WorkoutLevel>({
  beginner: msg('Beginner'),
  intermediate: msg('Intermediate'),
  advanced: msg('Advanced'),
});

export const workoutLevelTone: Record<WorkoutLevel, BadgeTone> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};
