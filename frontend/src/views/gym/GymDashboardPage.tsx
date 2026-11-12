import React from 'react';
import { Link } from 'react-router-dom';
import { ExpiringMemberships } from '@/components/dashboard/ExpiringMemberships';
import { MiniStat } from '@/components/dashboard/MiniStat';
import { RecentCheckIns } from '@/components/dashboard/RecentCheckIns';
import { TodayClasses } from '@/components/dashboard/TodayClasses';
import { VisitsChart } from '@/components/dashboard/VisitsChart';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useClasses } from '@/hooks/classes';
import { useGymDashboard } from '@/hooks/dashboard';
import { t } from '@/i18n';
import { formatMoney } from '@/utils/format';

const panel = 'p-4 sm:p-5 motion-safe:animate-fade-up';

const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return t('Good morning,');
  if (hour < 18) return t('Good afternoon,');
  return t('Good evening,');
};

export const GymDashboardPage: React.FC = () => {
  const { data, isLoading, error } = useGymDashboard();
  const { classes } = useClasses();

  // Things the owner can act on right now.
  const attention = data
    ? [
        {
          show: data.pendingPayments > 0,
          to: '/memberships',
          text: t('{{n}} payment(s) waiting for confirmation', {
            n: data.pendingPayments,
          }),
        },
        {
          show: data.lowStockProducts > 0,
          to: '/products',
          text: t('{{n}} product(s) running low', { n: data.lowStockProducts }),
        },
        {
          show: data.expiringSoon > 0,
          to: '/memberships',
          text: t('{{n}} membership(s) ending within 7 days', {
            n: data.expiringSoon,
          }),
        },
      ].filter((item) => item.show)
    : [];

  return (
    <>
      <PageHeader
        eyebrow={t('Overview')}
        title={data ? greeting() : t('Welcome,')}
        accent={data ? data.gymName : t('your gym')}
        description={t('How your gym is doing today.')}
      />

      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label={t('Loading')}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      ) : null}
      {error ? <Alert>{error.message}</Alert> : null}

      {data ? (
        <div className="space-y-4">
          {attention.length > 0 ? (
            <div className="flex flex-wrap gap-2 motion-safe:animate-fade-up">
              {attention.map((item) => (
                <Link
                  key={item.text}
                  to={item.to}
                  className="inline-flex items-center gap-2 rounded-full border border-warn/30 bg-warn/10 px-3 py-1.5 text-xs font-medium text-warn transition-colors hover:bg-warn/20"
                >
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  {item.text}
                </Link>
              ))}
            </div>
          ) : null}

          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MiniStat
              index={0}
              icon="scan"
              label={t('Check-ins today')}
              value={data.attendance.today}
              to="/attendance"
            />
            <MiniStat
              index={1}
              icon="users"
              label={t('In the gym now')}
              value={data.attendance.currentlyInside}
              hint={t('Checked in recently')}
              live
              accent
            />
            <MiniStat
              index={2}
              icon="badge"
              label={t('Active memberships')}
              value={data.activeMemberships}
              to="/memberships"
            />
            <MiniStat
              index={3}
              icon="users"
              label={t('Clients')}
              value={data.totalClients}
              hint={t('{{n}} active', { n: data.activeClients })}
              to="/clients"
            />
            <MiniStat
              index={4}
              icon="clock"
              label={t('This week')}
              value={data.attendance.thisWeek}
              hint={t('{{n}} this month', { n: data.attendance.thisMonth })}
            />
            <MiniStat
              index={5}
              icon="trend"
              label={t('Revenue this month')}
              value={data.revenueThisMonth}
              format={(value) => formatMoney(Math.round(value))}
              accent
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card flush className={`${panel} lg:col-span-2`}>
              <VisitsChart days={data.visitsByDay} />
            </Card>
            <Card flush className={panel}>
              <TodayClasses classes={classes} />
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card flush className={panel}>
              <ExpiringMemberships memberships={data.expiringMemberships} />
            </Card>
            <Card flush className={panel}>
              <RecentCheckIns checkIns={data.recentCheckIns} />
            </Card>
          </section>
        </div>
      ) : null}
    </>
  );
};
