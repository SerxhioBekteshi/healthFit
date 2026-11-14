import { isTermPlan } from '@/components/membership-plans/priceTable';
import { describePlan } from '@/components/membership-plans/SubscribeDialog';
import { genderLabels } from '@/utils/constants/labels';
import type { MembershipPlan } from '@gym/shared/types';

// "Men · 3x per week, 1 month" for the standard table, the plan name for extras.
export const planLabel = (plan: MembershipPlan): string =>
  `${genderLabels[plan.gender]} · ${isTermPlan(plan) ? describePlan(plan) : plan.name}`;
