import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { WeekCalendar } from '@/components/attendance/WeekCalendar';
import { WeekTrend } from '@/components/attendance/WeekTrend';
import { VisitBoxes } from '@/components/memberships/VisitBoxes';
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton, StatGridSkeleton } from '@/components/ui/Skeleton';
import { useClientDashboard } from '@/hooks/dashboard';
import { t } from '@/i18n';
import { formatDay, formatMoney } from '@/utils/format';

const daysRemaining = (endDate: string): string => {
  const diff = Math.ceil(
    (new Date(`${endDate}T00:00:00Z`).getTime() - Date.now()) / 86_400_000
  );
  if (diff < 0) {
    const n = Math.abs(diff);
    return n === 1
      ? t('Finished 1 day ago')
      : t('Finished {{n}} days ago', { n });
  }
  if (diff === 0) return t('Ends today');
  return diff === 1 ? t('Ends in 1 day') : t('Ends in {{n}} days', { n: diff });
};

export const ClientDashboardPage: React.FC = () => {
  const { data, isLoading, error } = useClientDashboard();
  const membership = data?.activeMembership ?? null;

  return (
    <>
      <PageHeader
        eyebrow={t('Member area')}
        title={
          data
            ? t('Welcome, {{name}}.', { name: data.fullName.split(' ')[0] })
            : t('Welcome.')
        }
        accent={t('Let’s train')}
        description={t('Your membership, balance and gym activity.')}
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-52 lg:col-span-2" />
            <Skeleton className="h-52" />
          </div>
          <StatGridSkeleton />
        </div>
      ) : null}
      {error ? <Alert>{error.message}</Alert> : null}

      {data ? (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="client-card-reveal order-2 lg:order-1 lg:col-span-2">
              <p className="text-sm text-bone/55">{t('Current membership')}</p>
              {membership ? (
                <div className="mt-4">
                  <p className="text-2xl font-semibold tracking-tight text-bone">
                    {membership.planName}
                  </p>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone="success">{t('Active')}</Badge>
                      <span className="text-sm text-bone/65">
                        {daysRemaining(membership.visitsEndDate)} ·{' '}
                        {formatDay(membership.visitsEndDate)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-bone/65">
                      <span>
                        <AnimatedNumber
                          value={membership.price}
                          format={formatMoney}
                        />
                      </span>
                    </div>
                  </div>
                  {membership.visitsAllowed > 0 ? (
                    <div className="mt-5">
                      <p className="mb-3 text-base font-medium text-bone">
                        {t('{{n}} of {{total}} visits left this month', {
                          n: Math.max(
                            membership.visitsAllowed - membership.visitsUsed,
                            0
                          ),
                          total: membership.visitsAllowed,
                        })}
                      </p>
                      <VisitBoxes
                        total={membership.visitsAllowed}
                        used={membership.visitsUsed}
                      />
                    </div>
                  ) : membership.planType !== 'visit_based' ? (
                    <p className="mt-5 text-base font-medium text-bone">
                      {t('Unlimited visits')}
                    </p>
                  ) : null}
                  <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    {membership.planType === 'visit_based' ? (
                      <div>
                        <dt className="text-xs text-bone/45">
                          {t('Visits remaining')}
                        </dt>
                        <dd className="mt-1 text-bone">
                          <AnimatedNumber value={membership.visitsRemaining} />
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : (
                <div className="relative mt-5 space-y-4">
                  <p className="text-sm text-bone/60">
                    {t('No active membership. Pick a plan to get started.')}
                  </p>
                  <Link to="/client/membership">
                    <Button size="sm">{t('Choose a membership')}</Button>
                  </Link>
                </div>
              )}
            </Card>

            <Card className="client-card-reveal order-1 flex flex-col items-center justify-center text-center lg:order-2">
              <p className="text-sm text-bone/55">{t('Check-in pass')}</p>
              <div className="mt-4 rounded-xl bg-[#fff] p-3">
                <QRCodeSVG value={data.clientId} size={132} />
              </div>
              <p className="mt-4 text-xs text-bone/50">
                {t('Show this code at reception.')}
              </p>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-12">
            <Card className="client-card-reveal lg:col-span-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-bone/55">{t('This week')}</p>
                <WeekTrend week={data.week} />
              </div>
              <WeekCalendar week={data.week} />
              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-bone/65">
                <span
                  className={`h-2 w-2 rounded-full ${
                    data.currentlyInside > 0 ? 'bg-signal' : 'bg-bone/30'
                  }`}
                />
                <>
                  <AnimatedNumber value={data.currentlyInside} />{' '}
                  {data.currentlyInside === 1
                    ? t('person in the gym now')
                    : t('people in the gym now')}
                </>
              </div>
            </Card>

            <div className="grid content-start gap-4 lg:col-span-6">
              <Link
                to="/client/balance"
                className="client-card-reveal flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-panel px-5 py-4 shadow-sm transition-colors hover:border-white/20"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal">
                    <Icon name="wallet" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs text-bone/50">
                      {t('Balance')}
                    </span>
                    <span className="block text-lg font-semibold leading-tight tabular-nums text-bone">
                      <AnimatedNumber
                        value={data.balance}
                        format={formatMoney}
                      />
                    </span>
                  </span>
                </span>
                <Icon name="chevron" className="h-4 w-4 text-bone/30" />
              </Link>

              <dl className="client-card-reveal grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-panel py-4 shadow-sm">
                {[
                  { label: t('Check-ins'), value: data.attendance.total },
                  { label: t('Last 7 days'), value: data.attendance.last7Days },
                  {
                    label: t('Last 30 days'),
                    value: data.attendance.last30Days,
                  },
                ].map((item) => (
                  <div key={item.label} className="px-4 text-center">
                    <dd className="text-lg font-semibold leading-tight tabular-nums text-bone">
                      <AnimatedNumber value={item.value} />
                    </dd>
                    <dt className="mt-0.5 text-xs text-bone/50">
                      {item.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
};
