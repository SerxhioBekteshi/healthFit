import { isTermPlan } from '@/components/membership-plans/priceTable';
import type { MembershipPlan, PlanOffer } from '@gym/shared/types';

export interface OfferGroup {
  offer: PlanOffer;
  plans: MembershipPlan[];
}

// A member's current offers: the one covering the whole price list replaces it, the others show as cards.
export const groupOffers = (
  plans: MembershipPlan[]
): { priceList: OfferGroup | null; custom: OfferGroup[] } => {
  const active = plans.filter((plan) => plan.isActive);
  const groups = new Map<string, OfferGroup>();
  for (const plan of active) {
    if (!plan.offer) continue;
    const group = groups.get(plan.offer.id) ?? { offer: plan.offer, plans: [] };
    group.plans.push(plan);
    groups.set(plan.offer.id, group);
  }

  const termPlans = active.filter(isTermPlan);
  const all = [...groups.values()].sort((a, b) =>
    a.offer.endDate.localeCompare(b.offer.endDate)
  );
  const priceList =
    termPlans.length > 0
      ? (all.find((group) =>
          termPlans.every((plan) => plan.offer?.id === group.offer.id)
        ) ?? null)
      : null;
  return { priceList, custom: all.filter((group) => group !== priceList) };
};
