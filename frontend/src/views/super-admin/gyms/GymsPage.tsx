import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useGyms } from '@/hooks/gyms';
import { useConfirm } from '@/hooks/confirm';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { countryNames } from '@/utils/constants/countries';
import type { Gym } from '@gym/shared/types';
import type { GymFormValues } from '@gym/shared/validation/gyms';
import { GymFormDrawer } from './GymFormDrawer';

type StatusFilter = 'all' | 'active' | 'inactive';

export const GymsPage: React.FC = () => {
  const { gyms, isLoading, error, createGym, updateGym, setGymActive } =
    useGyms();
  const { confirm, dialog } = useConfirm();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Gym | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const saveMutation = editing ? updateGym : createGym;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (gym: Gym | null): void => {
    createGym.reset();
    updateGym.reset();
    setEditing(gym);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: GymFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateGym.mutateAsync({ gymId: editing.id, input: values });
      } else {
        await createGym.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<Gym>[] = [
    {
      key: 'name',
      header: t('Gym'),
      primary: true,
      sortValue: (gym) => gym.name,
      cell: (gym) => (
        <div>
          <p className="font-semibold text-bone">{gym.name}</p>
          <p className="text-xs text-bone/45">{gym.location}</p>
        </div>
      ),
    },
    {
      key: 'country',
      header: t('Country'),
      sortValue: (gym) => countryNames[gym.country],
      searchValue: (gym) => countryNames[gym.country],
      cell: (gym) => countryNames[gym.country],
    },
    { key: 'hours', header: t('Hours'), cell: (gym) => gym.businessHours },
    {
      key: 'admins',
      header: t('Admins'),
      cell: (gym) =>
        gym.adminEmails.length > 0 ? gym.adminEmails.join(', ') : '—',
    },
    {
      key: 'domain',
      header: t('Domain'),
      cell: (gym) => (
        <span className="font-mono text-xs text-bone/60">
          {gym.customDomain ||
            (gym.subdomain ? `${gym.subdomain}.platform.com` : '—')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      cell: (gym) => (
        <Badge tone={gym.isActive ? 'success' : 'neutral'}>
          {gym.isActive ? t('Active') : t('Inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (gym) => (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon="pencil"
            onClick={() => openDrawer(gym)}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant={gym.isActive ? 'warning' : 'success'}
            disabled={setGymActive.isPending}
            onClick={() =>
              gym.isActive
                ? confirm({
                    title: t('Deactivate {{name}}?', { name: gym.name }),
                    description: t(
                      'Its admins and members are blocked until you activate the gym again. Nothing is deleted.'
                    ),
                    confirmLabel: t('Deactivate gym'),
                    tone: 'warning',
                    onConfirm: () =>
                      setGymActive.mutate({ gymId: gym.id, isActive: false }),
                  })
                : setGymActive.mutate({ gymId: gym.id, isActive: true })
            }
          >
            {gym.isActive ? t('Deactivate') : t('Activate')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({
    rows: gyms,
    columns,
    searchFields: (gym) => [gym.name, gym.location, ...gym.adminEmails],
    filter: (gym) =>
      statusFilter === 'all' || gym.isActive === (statusFilter === 'active'),
  });

  return (
    <>
      <PageHeader
        title={t('Manage')}
        accent={t('gyms')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Create gym')}
          </Button>
        }
      />

      {setGymActive.error ? (
        <Alert className="mb-4">{setGymActive.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(gym) => gym.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search by name, location or admin email')}
        toolbar={
          <FilterSelect
            label={t('Filter by status')}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              table.setPage(0);
            }}
            options={[
              { value: 'all', label: t('All'), count: gyms.length },
              {
                value: 'active',
                label: t('Active'),
                count: gyms.filter((gym) => gym.isActive).length,
              },
              {
                value: 'inactive',
                label: t('Inactive'),
                count: gyms.filter((gym) => !gym.isActive).length,
              },
            ]}
          />
        }
        emptyTitle={t('No gyms match')}
        emptyHint={t('Adjust the search or filters, or create a gym.')}
      />

      <GymFormDrawer
        isOpen={isDrawerOpen}
        gym={editing}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      {dialog}
    </>
  );
};
