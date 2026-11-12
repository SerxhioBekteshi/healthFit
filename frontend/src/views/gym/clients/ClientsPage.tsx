import React, { useState } from 'react';
import { CheckInCode } from '@/components/clients/CheckInCode';
import { ActionMenu } from '@/components/ui/ActionMenu';
import {
  AssignMembershipDrawer,
  type AssignDefaults,
} from '@/components/memberships/AssignMembershipDrawer';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useClients } from '@/hooks/clients';
import { useConfirm } from '@/hooks/confirm';
import { useMembershipPlans } from '@/hooks/membership-plans';
import { useMemberships } from '@/hooks/memberships';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import type { Client } from '@gym/shared/types';
import { genderLabels } from '@/utils/constants/labels';
import { describePeriod } from '@/utils/memberships';
import type { CreateClientValues } from '@gym/shared/validation/clients';
import type { CreateMembershipValues } from '@gym/shared/validation/memberships';
import { ClientBalanceDrawer } from './ClientBalanceDrawer';
import { ClientDetailsDrawer } from './ClientDetailsDrawer';
import { ClientFormDrawer } from './ClientFormDrawer';

type StatusFilter = 'all' | 'active' | 'inactive';

export const ClientsPage: React.FC = () => {
  const {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    setClientActive,
  } = useClients();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [balanceClient, setBalanceClient] = useState<Client | null>(null);
  const [status, setStatus] = useState<StatusFilter>('all');
  const { plans } = useMembershipPlans();
  const { createMembership } = useMemberships();
  const { confirm, dialog } = useConfirm();
  const [assignDefaults, setAssignDefaults] = useState<AssignDefaults | null>(
    null
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeClients = clients.filter((client) => client.isActive);
  const activePlans = plans.filter((plan) => plan.isActive);

  const openAssign = (client: Client): void => {
    createMembership.reset();
    setFeedback(null);
    setAssignDefaults({ clientId: client.id });
  };

  const onAssign = async (values: CreateMembershipValues): Promise<void> => {
    try {
      const saved = await createMembership.mutateAsync(values);
      const name = clients.find(
        (item) => item.id === values.clientId
      )?.fullName;
      setFeedback(
        `${
          name
            ? t('Membership assigned to {{name}}.', { name })
            : t('Membership assigned.')
        } ${describePeriod(saved)}`
      );
      setAssignDefaults(null);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const askDisable = (client: Client): void =>
    confirm({
      title: t('Disable this account?'),
      description: t(
        '{{name}} will not be able to sign in or check in. Their memberships stay as they are, and you can enable the account again.',
        { name: client.fullName }
      ),
      confirmLabel: t('Disable account'),
      tone: 'warning',
      onConfirm: () =>
        setClientActive.mutate({ clientId: client.id, isActive: false }),
    });

  const saveMutation = editing ? updateClient : createClient;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (client: Client | null): void => {
    createClient.reset();
    updateClient.reset();
    setEditing(client);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: CreateClientValues): Promise<void> => {
    try {
      if (editing) {
        await updateClient.mutateAsync({
          clientId: editing.id,
          input: values,
        });
      } else {
        await createClient.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: t('Member'),
      primary: true,
      sortValue: (client) => client.fullName,
      searchValue: (client) => `${client.fullName} ${client.email}`,
      cell: (client) => (
        <div className="flex items-center gap-3">
          <Avatar name={client.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-bone">
              {client.fullName}
            </p>
            <p className="truncate text-xs text-bone/45">{client.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('Phone'),
      searchValue: (client) => client.phone,
      cell: (client) => client.phone,
    },
    {
      key: 'code',
      header: t('Check-in code'),
      searchValue: (client) => client.id,
      cell: (client) => <CheckInCode code={client.id} />,
    },
    {
      key: 'gender',
      header: t('Gender'),
      sortValue: (client) => client.gender ?? '',
      searchValue: (client) =>
        client.gender ? genderLabels[client.gender] : t('Not set'),
      cell: (client) =>
        client.gender ? (
          genderLabels[client.gender]
        ) : (
          <span className="text-warn">{t('Not set')}</span>
        ),
    },
    {
      key: 'status',
      header: t('Account'),
      sortValue: (client) => (client.isActive ? 0 : 1),
      searchValue: (client) => (client.isActive ? t('Enabled') : t('Disabled')),
      cell: (client) => (
        <Badge tone={client.isActive ? 'success' : 'neutral'}>
          {client.isActive ? t('Enabled') : t('Disabled')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      actions: true,
      align: 'right',
      cell: (client) => (
        <ActionMenu
          items={[
            {
              label: t('Assign membership'),
              icon: 'badge',
              hint: t('Sell a membership to this client'),
              disabled: !client.isActive || activePlans.length === 0,
              onClick: () => openAssign(client),
            },
            {
              label: t('View details'),
              icon: 'eye',
              onClick: () => setSelected(client),
            },
            {
              label: t('Balance'),
              icon: 'wallet',
              onClick: () => setBalanceClient(client),
            },
            {
              label: t('Edit'),
              icon: 'pencil',
              onClick: () => openDrawer(client),
            },
            {
              label: client.isActive
                ? t('Disable account')
                : t('Enable account'),
              icon: 'power',
              tone: client.isActive ? 'warning' : 'success',
              hint: client.isActive
                ? t('Block sign-in and check-in. Memberships are not changed.')
                : t('Let this client sign in and check in again.'),
              disabled: setClientActive.isPending,
              onClick: () =>
                client.isActive
                  ? askDisable(client)
                  : setClientActive.mutate({
                      clientId: client.id,
                      isActive: true,
                    }),
            },
          ]}
        />
      ),
    },
  ];

  const table = useTableController({
    rows: clients,
    columns,
    filter: (client) =>
      status === 'all' || client.isActive === (status === 'active'),
  });

  return (
    <>
      <PageHeader
        title={t('Your')}
        accent={t('clients')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Create client')}
          </Button>
        }
      />

      {feedback ? (
        <Alert tone="success" className="mb-4">
          {feedback}
        </Alert>
      ) : null}
      {setClientActive.error ? (
        <Alert className="mb-4">{setClientActive.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(client) => client.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search clients')}
        toolbar={
          <FilterSelect
            label={t('Filter by status')}
            value={status}
            onChange={(value) => {
              setStatus(value);
              table.setPage(0);
            }}
            options={[
              { value: 'all', label: t('All'), count: clients.length },
              {
                value: 'active',
                label: t('Enabled'),
                count: clients.filter((client) => client.isActive).length,
              },
              {
                value: 'inactive',
                label: t('Disabled'),
                count: clients.filter((client) => !client.isActive).length,
              },
            ]}
          />
        }
        emptyTitle={
          clients.length === 0 ? t('No clients yet') : t('No matches')
        }
        emptyHint={
          clients.length === 0
            ? t('Create your first client to get started.')
            : t('Try a different search or filter.')
        }
      />

      <ClientFormDrawer
        isOpen={isDrawerOpen}
        client={editing}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      <ClientDetailsDrawer
        client={selected}
        onClose={() => setSelected(null)}
      />
      <ClientBalanceDrawer
        client={balanceClient}
        onClose={() => setBalanceClient(null)}
      />
      <AssignMembershipDrawer
        isOpen={assignDefaults !== null}
        clients={activeClients}
        plans={activePlans}
        defaults={assignDefaults ?? undefined}
        isPending={createMembership.isPending}
        serverError={createMembership.error?.message ?? null}
        onSubmit={onAssign}
        onClose={() => setAssignDefaults(null)}
      />
      {dialog}
    </>
  );
};
