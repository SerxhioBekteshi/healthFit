import type { MembershipPlan, MembershipPlanType } from '@gym/shared/types';
import { planTerms } from '@/utils/labels';
import { planPrice } from '@/utils/memberships';

export type TermType = (typeof planTerms)[number]['type'];

export interface PriceList {
  // Weekly frequencies on offer (3, 4, ... and 0 for unlimited), 0 last.
  frequencies: number[];
  // Plan of one frequency and term, when the gym sells it.
  find: (weeklyVisits: number, term: TermType) => MembershipPlan | undefined;
  // Daily passes, visit packs and personal training.
  extras: MembershipPlan[];
}

const isTerm = (type: MembershipPlanType): type is TermType =>
  planTerms.some((term) => term.type === type);

// Sorts plans into the price table: a row per weekly frequency, a column per term.
export const buildPriceList = (plans: MembershipPlan[]): PriceList => {
  const grid = new Map<string, MembershipPlan>();
  const frequencies = new Set<number>();
  const extras: MembershipPlan[] = [];

  for (const plan of plans) {
    if (isTerm(plan.type)) {
      grid.set(`${plan.weeklyVisits}:${plan.type}`, plan);
      frequencies.add(plan.weeklyVisits);
    } else {
      extras.push(plan);
    }
  }

  const ordered = [...frequencies].sort((a, b) => {
    if (a === 0) return 1;
    if (b === 0) return -1;
    return a - b;
  });

  return {
    frequencies: ordered,
    find: (weeklyVisits, term) => grid.get(`${weeklyVisits}:${term}`),
    extras: extras.sort((a, b) => planPrice(a) - planPrice(b)),
  };
};

// How much cheaper a longer term is than paying monthly for the same time; 0 when there is no saving.
export const savingPercent = (
  plan: MembershipPlan,
  monthly: MembershipPlan | undefined
): number => {
  const months = planTerms.find((term) => term.type === plan.type)?.months ?? 1;
  if (!monthly || months === 1) return 0;
  const full = planPrice(monthly) * months;
  if (full <= 0) return 0;
  return Math.max(Math.round((1 - planPrice(plan) / full) * 100), 0);
};
