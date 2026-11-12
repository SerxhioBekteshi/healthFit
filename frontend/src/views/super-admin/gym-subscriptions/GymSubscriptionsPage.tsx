import React, { useMemo, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useGyms } from '@/hooks/gyms';
import { useGymSubscriptions } from '@/hooks/gym-subscriptions';
import { useConfirm } from '@/hooks/confirm';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { formatDay, formatMoney } from '@/utils/format';
import type { GymSubscription } from '@gym/shared/types';
import {
  subscriptionCycleLabels,
  subscriptionStatusLabels,
  subscriptionStatusTone,
} from '@/utils/constants/labels';
import type {
  CreateGymSubscriptionValues,
  SubscriptionPaymentValues,
} from '@gym/shared/validation/gym-subscriptions';
import { GymSubscriptionFormDrawer } from './GymSubscriptionFormDrawer';
import { SubscriptionPaymentDrawer } from './SubscriptionPaymentDrawer';

export const GymSubscriptionsPage: React.FC = () => {
  const { gyms } = useGyms();
  const {
    subscriptions,
    isLoading,
    error,
    createSubscription,
    updateSubscription,
    setSubscriptionStatus,
    recordPayment,
  } = useGymSubscriptions();
  const { confirm, dialog } = useConfirm();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<GymSubscription | null>(null);
  const [paying, setPaying] = useState<GymSubscription | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableGyms = useMemo(() => {
    const subscribed = new Set(subscriptions.map((item) => item.gymId));
    return gyms.filter((gym) => !subscribed.has(gym.id));
  }, [gyms, subscriptions]);

  const saveMutation = editing ? updateSubscription : createSubscription;
  const actionError = setSubscriptionStatus.error?.message ?? null;

  const openForm = (subscription: GymSubscription | null): void => {
    createSubscription.reset();
    updateSubscription.reset();
    setFeedback(null);
    setEditing(subscription);
    setIsFormOpen(true);
  };

  const onSave = async (values: CreateGymSubscriptionValues): Promise<void> => {
    try {
      if (editing) {
        await updateSubscription.mutateAsync({
          subscriptionId: editing.id,
          input: {
            planName: values.planName,
            cycle: values.cycle,
            price: values.price,
          },
        });
        setFeedback(t('Subscription updated.'));
      } else {
        await createSubscription.mutateAsync(values);
        setFeedback(t('Subscription created.'));
      }
      setIsFormOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const onPay = async (values: SubscriptionPaymentValues): Promise<void> => {
    if (!paying) return;
    try {
      await recordPayment.mutateAsync({
        subscriptionId: paying.id,
        input: values,
      });
      setFeedback(t('Payment recorded.'));
      setPaying(null);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<GymSubscription>[] = [
    {
      key: 'gym',
      header: t('Gym'),
      primary: true,
      sortValue: (subscription) => subscription.gymName,
      cell: (subscription) => (
        <div>
          <p className="font-semibold text-bone">{subscription.gymName}</p>
          <p className="text-xs text-bone/45">
            {subscription.planName} ·{' '}
            {subscriptionCycleLabels[subscription.cycle]}
          </p>
        </div>
      ),
    },
    {
      key: 'price',
      header: t('Price'),
      sortValue: (subscription) => subscription.price,
      cell: (subscription) => (
        <span className="font-semibold tabular-nums text-bone">
          {formatMoney(subscription.price)}
        </span>
      ),
    },
    {
      key: 'through',
      header: t('Paid through'),
      cell: (subscription) => formatDay(subscription.currentPeriodEnd),
    },
    {
      key: 'due',
      header: t('Next due'),
      sortValue: (subscription) => subscription.nextPaymentDue,
      cell: (subscription) => formatDay(subscription.nextPaymentDue),
    },
    {
      key: 'status',
      header: t('Status'),
      cell: (subscription) => (
        <Badge tone={subscriptionStatusTone[subscription.status]}>
          {subscriptionStatusLabels[subscription.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (subscription) => (
        <>
          {subscription.status !== 'cancelled' ? (
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                recordPayment.reset();
                setFeedback(null);
                setPaying(subscription);
              }}
            >
              {t('Record payment')}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            icon="pencil"
            onClick={() => openForm(subscription)}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant={
              subscription.status === 'cancelled' ? 'success' : 'warning'
            }
            disabled={setSubscriptionStatus.isPending}
            onClick={() => {
              const mutate = (status: 'active' | 'cancelled'): void =>
                setSubscriptionStatus.mutate({
                  subscriptionId: subscription.id,
                  status,
                });
              if (subscription.status === 'cancelled') {
                mutate('active');
                return;
              }
              confirm({
                title: t('Cancel this subscription?'),
                description: t(
                  '{{gym}} will stop being billed on {{plan}}. You can reactivate it later.',
                  { gym: subscription.gymName, plan: subscription.planName }
                ),
                confirmLabel: t('Cancel subscription'),
                cancelLabel: t('Keep subscription'),
                onConfirm: () => mutate('cancelled'),
              });
            }}
          >
            {subscription.status === 'cancelled'
              ? t('Reactivate')
              : t('Cancel')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({ rows: subscriptions, columns });

  return (
    <>
      <PageHeader
        title={t('Gym')}
        accent={t('subscriptions')}
        actions={
          <Button
            icon="plus"
            onClick={() => openForm(null)}
            disabled={availableGyms.length === 0}
          >
            {t('Create subscription')}
          </Button>
        }
      />

      <div className="mb-4 space-y-3 empty:hidden">
        {feedback ? <Alert tone="success">{feedback}</Alert> : null}
        {actionError ? <Alert>{actionError}</Alert> : null}
      </div>

      <Table
        controller={table}
        rowKey={(subscription) => subscription.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        emptyTitle={t('No subscriptions yet')}
        emptyHint={t('Subscribe a gym to a platform plan.')}
      />

      <GymSubscriptionFormDrawer
        isOpen={isFormOpen}
        subscription={editing}
        availableGyms={availableGyms}
        isPending={saveMutation.isPending}
        serverError={saveMutation.error?.message ?? null}
        onSubmit={onSave}
        onClose={() => setIsFormOpen(false)}
      />
      <SubscriptionPaymentDrawer
        subscription={paying}
        isPending={recordPayment.isPending}
        serverError={recordPayment.error?.message ?? null}
        onSubmit={onPay}
        onClose={() => setPaying(null)}
      />
      {dialog}
    </>
  );
};
