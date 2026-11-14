import React from 'react';
import { t } from '@/i18n';
import { formatDay, formatMoney } from '@/utils/format';
import type { MembershipPlan } from '@gym/shared/types';

// Regular price struck through next to the offer price; plain price when no offer is running.
export const PlanPrice: React.FC<{
  plan: MembershipPlan;
  showEnd?: boolean;
}> = ({ plan, showEnd = true }) => (
  <p className="text-xl font-semibold tabular-nums text-bone">
    {plan.offer ? (
      <>
        <span className="mr-2 text-sm font-normal text-bone/40 line-through">
          {formatMoney(plan.price)}
        </span>
        <span className="text-signal">{formatMoney(plan.offer.price)}</span>
        {showEnd ? (
          <span className="mt-0.5 block text-xs font-normal text-bone/50">
            {t('until {{date}}', { date: formatDay(plan.offer.endDate) })}
          </span>
        ) : null}
      </>
    ) : (
      formatMoney(plan.price)
    )}
  </p>
);
