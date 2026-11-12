import { planTerms } from '@/utils/constants/labels';
import type { MembershipPlan } from '@gym/shared/types';

export type PlanTerm = (typeof planTerms)[number];

export const DEFAULT_FREQUENCIES = [3, 4, 5, 6];

const termTypes: ReadonlySet<string> = new Set(
  planTerms.map((term) => term.type)
);

// Plans on the standard price table; visit packs and personal training are extras.
export const isTermPlan = (plan: MembershipPlan): boolean =>
  termTypes.has(plan.type);

// Unlimited (0) goes last.
export const sortFrequencies = (values: number[]): number[] =>
  [...new Set(values)].sort((a, b) => (a || 99) - (b || 99));

export interface PriceCell {
  plan: MembershipPlan;
  // Amount saved against paying the 1-month price for the whole term; 0 when none.
  saving: number;
}

export interface PriceRow {
  term: PlanTerm;
  cells: Record<number, PriceCell | undefined>;
}

export interface PriceTable {
  columns: number[];
  rows: PriceRow[];
}

interface BuildOptions {
  // Admin view: inactive plans still show their price slot.
  includeInactive?: boolean;
  // Columns that always show, e.g. the usual 3x-6x.
  minColumns?: number[];
  // Keep terms without any price (the editor needs every row).
  allTerms?: boolean;
}

export const buildPriceTable = (
  plans: MembershipPlan[],
  {
    includeInactive = false,
    minColumns = [],
    allTerms = false,
  }: BuildOptions = {}
): PriceTable => {
  const termPlans = plans.filter(
    (plan) => isTermPlan(plan) && (includeInactive || plan.isActive)
  );
  const columns = sortFrequencies([
    ...minColumns,
    ...termPlans.map((plan) => plan.weeklyVisits),
  ]);

  const pick = (term: PlanTerm, weeklyVisits: number) =>
    termPlans
      .filter(
        (plan) => plan.type === term.type && plan.weeklyVisits === weeklyVisits
      )
      // Active first, then the cheapest.
      .sort(
        (a, b) => Number(b.isActive) - Number(a.isActive) || a.price - b.price
      )[0];

  const rows = planTerms
    .map((term) => {
      const cells: PriceRow['cells'] = {};
      for (const weeklyVisits of columns) {
        const plan = pick(term, weeklyVisits);
        if (!plan) continue;
        const monthly = pick(planTerms[0], weeklyVisits);
        const baseline = monthly ? monthly.price * term.months : 0;
        cells[weeklyVisits] = {
          plan,
          saving:
            term.months > 1 && baseline > plan.price
              ? baseline - plan.price
              : 0,
        };
      }
      return { term, cells };
    })
    .filter((row) => allTerms || Object.keys(row.cells).length > 0);

  return { columns, rows };
};
