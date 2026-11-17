import React, { useState } from 'react';
import { MembershipQueue } from '@/components/memberships/MembershipQueue';
import { PlanPicker } from '@/components/memberships/PlanPicker';
import { SubscribeSheet } from '@/components/memberships/SubscribeSheet';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Screen } from '@/components/ui/Screen';
import { useMembershipPlans } from '@/hooks/membership-plans';
import { useMemberships } from '@/hooks/memberships';
import { useRefresh } from '@/hooks/refresh';
import { useTranslation } from '@/i18n';
import type { MembershipPlan } from '@gym/shared/types';

export default function MembershipScreen(): React.ReactElement {
  const { t } = useTranslation();
  const plans = useMembershipPlans();
  const memberships = useMemberships();
  const { refreshing, onRefresh } = useRefresh(
    plans.refetch,
    memberships.refetch
  );
  const [selected, setSelected] = useState<MembershipPlan | null>(null);

  const hasPending =
    memberships.data?.some((item) => item.status === 'pending') ?? false;

  return (
    <Screen
      title={t('Membership')}
      subtitle={t('Tap a price to subscribe with your credit or card.')}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      {hasPending ? (
        <Banner
          tone="warning"
          message={t(
            'You have a membership waiting for payment. Pay at the gym counter before buying another.'
          )}
        />
      ) : null}

      {memberships.data ? (
        <MembershipQueue memberships={memberships.data} />
      ) : null}

      <QueryBoundary query={plans}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              icon="pricetags-outline"
              title={t('No plans available')}
              message={t(
                'No membership plans are available for you right now. If this looks wrong, ask your gym to check your profile.'
              )}
            />
          ) : (
            <PlanPicker
              plans={list}
              disabled={hasPending}
              onSelect={setSelected}
            />
          )
        }
      </QueryBoundary>

      <SubscribeSheet plan={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}
