import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatGridSkeleton } from '@/components/ui/Skeleton';
import { usePlatformDashboard } from '@/hooks/dashboard';
import { t } from '@/i18n';
import { formatMoney } from '@/utils/format';

export const PlatformDashboardPage: React.FC = () => {
  const { data, isLoading, error } = usePlatformDashboard();

  return (
    <>
      <PageHeader
        eyebrow={t('Platform')}
        title={t('Every gym,')}
        accent={t('one view')}
        description={t('Gyms, members, subscriptions and platform revenue.')}
      />

      {isLoading ? <StatGridSkeleton count={8} /> : null}
      {error ? <Alert>{error.message}</Alert> : null}

      {data ? (
        <div className="space-y-4">
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon="building"
              label={t('Total gyms')}
              value={data.totalGyms}
              hint={t('{{active}} active / {{inactive}} inactive', {
                active: data.activeGyms,
                inactive: data.inactiveGyms,
              })}
            />
            <StatCard
              icon="users"
              label={t('Total members')}
              value={data.totalClients}
              hint={t('Across all gyms')}
            />
            <StatCard
              icon="badge"
              label={t('Active memberships')}
              value={data.activeMemberships}
              hint={t('Currently valid')}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="card"
              label={t('Active subscriptions')}
              value={data.subscriptions.active}
              hint={t('{{trialing}} trialing', {
                trialing: data.subscriptions.trialing,
              })}
            />
            <StatCard
              icon="alert"
              label={t('Past due')}
              value={data.subscriptions.pastDue}
              hint={t('{{amount}} overdue', {
                amount: formatMoney(data.overdueAmount),
              })}
            />
            <StatCard
              label={t('Cancelled')}
              value={data.subscriptions.cancelled}
            />
            <StatCard
              icon="scan"
              label={t('Check-ins (24h)')}
              value={data.checkInsLast24h}
              hint={t('Across all gyms')}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon="trend"
              accent
              label={t('Platform revenue')}
              value={formatMoney(data.revenueTotal)}
              hint={t('All time')}
            />
            <StatCard
              label={t('Revenue this month')}
              value={formatMoney(data.revenueThisMonth)}
            />
            <StatCard
              icon="dumbbell"
              label={t('Workout programs')}
              value={data.totalPrograms}
              hint={t('Published to gyms')}
            />
          </section>
        </div>
      ) : null}
    </>
  );
};
