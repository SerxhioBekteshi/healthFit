import React, { useState } from 'react';
import { MembershipQueue } from '@/components/memberships/MembershipQueue';
import { PriceListShowcase } from '@/components/membership-plans/PriceListShowcase';
import {
  SubscribeDialog,
  type SubscribeResult,
} from '@/components/membership-plans/SubscribeDialog';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMembershipPlans } from '@/hooks/membership-plans';
import { t } from '@/i18n';
import { useMemberships } from '@/hooks/memberships';
import { usePriceList } from '@/hooks/price-lists';
import { genderLabels } from '@/utils/constants/labels';
import type { MembershipPlan } from '@gym/shared/types';

export const ClientMembershipPage: React.FC = () => {
  const {
    plans,
    isLoading: plansLoading,
    error: plansError,
  } = useMembershipPlans();
  const { memberships } = useMemberships();
  const { notes, photos } = usePriceList();
  const [selected, setSelected] = useState<MembershipPlan | null>(null);
  const [result, setResult] = useState<SubscribeResult | null>(null);

  const pending = memberships.find((item) => item.status === 'pending');

  const open = (plan: MembershipPlan): void => {
    setResult(null);
    setSelected(plan);
  };

  return (
    <>
      <PageHeader
        eyebrow={t('Member area')}
        title={t('My')}
        accent={t('membership')}
        description={
          plans[0]
            ? t(
                'Price list for {{gender}}. Tap a price to subscribe with your credit or card.',
                { gender: genderLabels[plans[0].gender].toLowerCase() }
              )
            : t('Subscribe to a plan with your credit or card.')
        }
      />

      {result ? (
        <Alert
          className="mb-5"
          tone={result.type === 'success' ? 'success' : 'error'}
        >
          {result.message}
        </Alert>
      ) : null}
      {plansError ? <Alert>{plansError.message}</Alert> : null}

      <MembershipQueue memberships={memberships} />

      {plansLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-64" />
          ))}
        </div>
      ) : null}

      {!plansLoading && !plansError && plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-bone/55">
          {t(
            'No membership plans are available for you right now. If this looks wrong, ask your gym to check your profile.'
          )}
        </div>
      ) : null}

      {plans.length > 0 ? (
        <PriceListShowcase
          plans={plans}
          notes={notes}
          photos={photos}
          disabled={Boolean(pending)}
          onSelectPlan={open}
          renderExtraAction={(plan) => (
            <Button
              size="sm"
              disabled={Boolean(pending)}
              onClick={() => open(plan)}
            >
              {t('Subscribe')}
            </Button>
          )}
        />
      ) : null}

      <SubscribeDialog
        plan={selected}
        onClose={() => setSelected(null)}
        onResult={setResult}
      />
    </>
  );
};
