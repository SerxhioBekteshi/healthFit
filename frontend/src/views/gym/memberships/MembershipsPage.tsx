import React, { useMemo, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import {
  AssignMembershipDrawer,
  type AssignDefaults,
} from '@/components/memberships/AssignMembershipDrawer';
import { useClients } from '@/hooks/clients';
import { useConfirm } from '@/hooks/confirm';
import { useMembershipPlans } from '@/hooks/membership-plans';
import { useMemberships } from '@/hooks/memberships';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { formatDay } from '@/utils/format';
import { describePeriod, nextStart } from '@/utils/memberships';
import type { Membership } from '@gym/shared/types';
import {
  membershipStatusLabels,
  membershipStatusTone,
  paymentMethodLabels,
} from '@/utils/constants/labels';
import type { CreateMembershipValues } from '@gym/shared/validation/memberships';

export const MembershipsPage: React.FC = () => {
  const { clients } = useClients();
  const { plans } = useMembershipPlans();
  const {
    memberships,
    isLoading,
    error,
    createMembership,
    cancelMembership,
    confirmPayment,
  } = useMemberships();
  const { confirm, dialog } = useConfirm();

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignDefaults, setAssignDefaults] = useState<
    AssignDefaults | undefined
  >(undefined);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeClients = useMemo(
    () => clients.filter((client) => client.isActive),
    [clients]
  );
  const activePlans = useMemo(
    () => plans.filter((plan) => plan.isActive),
    [plans]
  );
  const clientNames = useMemo(
    () => new Map(clients.map((client) => [client.id, client.fullName])),
    [clients]
  );
  const actionError =
    cancelMembership.error?.message ?? confirmPayment.error?.message ?? null;

  const onAssign = async (values: CreateMembershipValues): Promise<void> => {
    try {
      const saved = await createMembership.mutateAsync(values);
      setFeedback(
        `${assignDefaults?.renewing ? t('Membership renewed.') : t('Membership assigned.')} ${describePeriod(saved)}`
      );
      setIsAssignOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const openAssign = (defaults?: AssignDefaults): void => {
    createMembership.reset();
    setFeedback(null);
    setAssignDefaults(defaults);
    setIsAssignOpen(true);
  };

  // A renewal starts the day after the client's last booked membership ends; the date is not editable.
  const openRenew = (membership: Membership): void => {
    const queue = memberships.filter(
      (item) => item.clientId === membership.clientId
    );
    openAssign({
      clientId: membership.clientId,
      planId: membership.planId,
      startDate: nextStart(queue).date,
      renewing: true,
    });
  };

  const askCancel = (membership: Membership): void =>
    confirm({
      title: t('Cancel this membership?'),
      description: t(
        '{{name}} will lose access with {{plan}}. This cannot be undone.',
        {
          name: clientNames.get(membership.clientId) ?? t('The client'),
          plan: membership.planName,
        }
      ),
      confirmLabel: t('Cancel membership'),
      cancelLabel: t('Keep membership'),
      onConfirm: () => cancelMembership.mutate(membership.id),
    });

  const columns: Column<Membership>[] = [
    {
      key: 'client',
      header: t('Client'),
      primary: true,
      sortValue: (membership) => clientNames.get(membership.clientId),
      searchValue: (membership) =>
        `${clientNames.get(membership.clientId) ?? ''} ${membership.planName}`,
      cell: (membership) => (
        <div>
          <p className="font-semibold text-bone">
            {clientNames.get(membership.clientId) ?? '—'}
          </p>
          <p className="text-xs text-bone/45">{membership.planName}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: t('Period'),
      sortValue: (membership) => membership.endDate,
      searchValue: (membership) =>
        `${membership.startDate} ${membership.endDate}`,
      cell: (membership) => (
        <span className="tabular-nums">
          {formatDay(membership.startDate)} → {formatDay(membership.endDate)}
        </span>
      ),
    },
    {
      key: 'payment',
      header: t('Payment'),
      searchValue: (membership) =>
        `${paymentMethodLabels[membership.paymentMethod]} ${membership.paymentStatus}`,
      cell: (membership) => (
        <span>
          {paymentMethodLabels[membership.paymentMethod]}
          {membership.paymentStatus === 'pending' ? (
            <span className="ml-2 text-warn">{t('pending')}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'visits',
      header: t('Visits'),
      searchValue: (membership) =>
        membership.planType === 'visit_based' ? membership.visitsRemaining : '',
      cell: (membership) =>
        membership.planType === 'visit_based'
          ? membership.visitsRemaining
          : '—',
    },
    {
      key: 'status',
      header: t('Status'),
      searchValue: (membership) => membershipStatusLabels[membership.status],
      cell: (membership) => (
        <Badge tone={membershipStatusTone[membership.status]}>
          {membershipStatusLabels[membership.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (membership) => (
        <>
          {membership.status === 'pending' ? (
            <Button
              size="sm"
              variant="success"
              disabled={confirmPayment.isPending}
              onClick={() => confirmPayment.mutate(membership.id)}
            >
              {t('Confirm payment')}
            </Button>
          ) : null}
          {['active', 'expired', 'cancelled'].includes(membership.status) ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openRenew(membership)}
            >
              {t('Renew')}
            </Button>
          ) : null}
          {membership.status !== 'cancelled' ? (
            <Button
              size="sm"
              variant="danger"
              disabled={cancelMembership.isPending}
              onClick={() => askCancel(membership)}
            >
              {t('Cancel')}{' '}
            </Button>
          ) : null}
        </>
      ),
    },
  ];

  const table = useTableController({ rows: memberships, columns });

  return (
    <>
      <PageHeader
        title={t('Member')}
        accent={t('memberships')}
        actions={
          <Button
            icon="plus"
            onClick={() => openAssign()}
            disabled={activePlans.length === 0 || activeClients.length === 0}
          >
            {t('Assign membership')}
          </Button>
        }
      />

      <div className="mb-4 space-y-3 empty:hidden">
        {feedback ? <Alert tone="success">{feedback}</Alert> : null}
        {actionError ? <Alert>{actionError}</Alert> : null}
      </div>

      <Table
        controller={table}
        rowKey={(membership) => membership.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search memberships')}
        emptyTitle={t('No memberships yet')}
        emptyHint={t('Assign a plan to one of your clients.')}
      />

      <AssignMembershipDrawer
        isOpen={isAssignOpen}
        clients={activeClients}
        plans={activePlans}
        defaults={assignDefaults}
        isPending={createMembership.isPending}
        serverError={createMembership.error?.message ?? null}
        onSubmit={onAssign}
        onClose={() => setIsAssignOpen(false)}
      />
      {dialog}
    </>
  );
};
