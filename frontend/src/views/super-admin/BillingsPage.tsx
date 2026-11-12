import React from 'react';
import { StatCard } from '@/components/common/StatCard';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { usePlatformDashboard } from '@/hooks/dashboard';
import { useGymSubscriptions } from '@/hooks/gym-subscriptions';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { paymentMethodLabels } from '@/utils/constants/labels';
import { formatDate, formatDay, formatMoney } from '@/utils/format';
import type { GymSubscriptionPayment } from '@gym/shared/types';

export const BillingsPage: React.FC = () => {
  const { payments, subscriptions, isLoading, error } = useGymSubscriptions();
  const { data: summary } = usePlatformDashboard();
  const overdue = subscriptions.filter((item) => item.status === 'past_due');
  const columns: Column<GymSubscriptionPayment>[] = [
    {
      key: 'date',
      header: t('Date'),
      cell: (payment) => formatDate(payment.paidAt),
    },
    {
      key: 'gym',
      header: t('Gym'),
      primary: true,
      cell: (payment) => (
        <span className="font-semibold text-bone">{payment.gymName}</span>
      ),
    },
    { key: 'plan', header: t('Plan'), cell: (payment) => payment.planName },
    {
      key: 'method',
      header: t('Method'),
      cell: (payment) => paymentMethodLabels[payment.paymentMethod],
    },
    {
      key: 'reference',
      header: t('Reference'),
      cell: (payment) => (
        <span className="font-mono text-xs text-bone/60">
          {payment.providerReference}
        </span>
      ),
    },
    {
      key: 'amount',
      header: t('Amount'),
      align: 'right',
      cell: (payment) => (
        <span className="font-semibold tabular-nums text-bone">
          {formatMoney(payment.amount)}
        </span>
      ),
    },
  ];
  const table = useTableController({ rows: payments, columns });

  return (
    <>
      <PageHeader title={t('Billings')} accent={t('& revenue')} />

      <div className="space-y-4">
        {summary ? (
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon="trend"
              accent
              label={t('Revenue this month')}
              value={formatMoney(summary.revenueThisMonth)}
            />
            <StatCard
              label={t('Revenue all time')}
              value={formatMoney(summary.revenueTotal)}
            />
            <StatCard
              icon="alert"
              label={t('Overdue')}
              value={formatMoney(summary.overdueAmount)}
              hint={t('{{pastDue}} gym(s) past due', {
                pastDue: summary.subscriptions.pastDue,
              })}
            />
          </section>
        ) : null}

        {overdue.length > 0 ? (
          <Alert tone="warning">
            <p className="font-semibold">{t('Overdue subscriptions')}</p>
            <ul className="mt-1 space-y-0.5">
              {overdue.map((item) => (
                <li key={item.id}>
                  {t('{{gym}} — {{price}} due {{date}}', {
                    gym: item.gymName,
                    price: formatMoney(item.price),
                    date: formatDay(item.nextPaymentDue),
                  })}
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <div className="pt-4">
          <Table
            controller={table}
            rowKey={(payment) => payment.id}
            isLoading={isLoading}
            error={error?.message ?? null}
            emptyTitle={t('No payments recorded yet')}
          />
        </div>
      </div>
    </>
  );
};
