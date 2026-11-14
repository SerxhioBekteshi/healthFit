import React from 'react';
import { describePlan } from '@/components/membership-plans/SubscribeDialog';
import { PlanPrice } from '@/components/membership-plans/PlanPrice';
import { isTermPlan } from '@/components/membership-plans/priceTable';
import type { OfferGroup } from '@/components/membership-plans/offerGroups';
import { t } from '@/i18n';
import { planTypeLabels } from '@/utils/constants/labels';
import { formatDay } from '@/utils/format';
import type { MembershipPlan } from '@gym/shared/types';

interface OfferPlansProps {
  group: OfferGroup;
  // Per-plan control, e.g. the subscribe button.
  renderAction: (plan: MembershipPlan) => React.ReactNode;
}

// A special offer on chosen plans, shown as cards like passes and extras, with its period.
export const OfferPlans: React.FC<OfferPlansProps> = ({
  group,
  renderAction,
}) => (
  <section>
    <div className="mb-3">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-signal">
        {t('Special offer')}
      </p>
      <h2 className="mt-1 font-display text-2xl font-normal text-bone">
        {group.offer.name}
      </h2>
      <p className="mt-1 text-sm text-bone/55">
        {t('Valid {{from}} to {{to}}', {
          from: formatDay(group.offer.startDate),
          to: formatDay(group.offer.endDate),
        })}
      </p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {group.plans.map((plan) => (
        <article
          key={plan.id}
          className="flex flex-col justify-between rounded-xl border border-signal/30 bg-panel p-5 transition-colors hover:border-signal/60"
        >
          <div>
            <p className="font-semibold text-bone">
              {isTermPlan(plan) ? describePlan(plan) : plan.name}
            </p>
            <p className="mt-1 text-xs text-bone/50">
              {isTermPlan(plan) ? null : `${planTypeLabels[plan.type]} · `}
              {plan.durationDays === 1
                ? t('valid 1 day')
                : t('valid {{n}} days', { n: plan.durationDays })}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <PlanPrice plan={plan} showEnd={false} />
            {renderAction(plan)}
          </div>
        </article>
      ))}
    </div>
  </section>
);
