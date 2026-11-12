import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { isTermPlan } from '@/components/membership-plans/priceTable';
import { t } from '@/i18n';
import { genderLabels, planTypeLabels } from '@/utils/constants/labels';
import { formatMoney } from '@/utils/format';
import type { MembershipPlan } from '@gym/shared/types';

interface ExtraPlansProps {
  plans: MembershipPlan[];
  title?: string;
  // Per-plan controls: edit/hide for gym admins, subscribe for clients.
  renderAction: (plan: MembershipPlan) => React.ReactNode;
  showGender?: boolean;
}

// Daily pass, visit packs and personal training: everything outside the standard price table.
export const ExtraPlans: React.FC<ExtraPlansProps> = ({
  plans,
  title = t('Extras'),
  renderAction,
  showGender = false,
}) => {
  const extras = plans.filter((plan) => !isTermPlan(plan));
  if (extras.length === 0) {
    return null;
  }

  return (
    <section>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-bone/45">
          {title}
        </h2>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {extras.map((plan) => (
          <article
            key={plan.id}
            className={`flex flex-col justify-between rounded-xl border border-white/10 bg-panel p-5 transition-colors hover:border-white/25 ${
              plan.isActive ? '' : 'opacity-50'
            }`}
          >
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-bone">
                {plan.name}
                {plan.isActive ? null : <Badge>{t('Hidden')}</Badge>}
              </p>
              <p className="mt-1 text-xs text-bone/50">
                {planTypeLabels[plan.type]}
                {plan.type === 'visit_based' ? (
                  <>
                    {' · '}
                    {plan.visitCount === 1
                      ? t('1 visit')
                      : t('{{n}} visits', { n: plan.visitCount })}
                  </>
                ) : (
                  ''
                )}
                {' · '}
                {plan.durationDays === 1
                  ? t('valid 1 day')
                  : t('valid {{n}} days', { n: plan.durationDays })}
                {showGender ? ` · ${genderLabels[plan.gender]}` : ''}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xl font-semibold tabular-nums text-bone">
                {formatMoney(plan.price)}
              </p>
              {renderAction(plan)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
