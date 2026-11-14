import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useAccessSettings } from '@/hooks/access-settings';
import { useConfirm } from '@/hooks/confirm';
import { useGymLocations } from '@/hooks/gym-locations';
import { useLockers } from '@/hooks/lockers';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { formatTime } from '@/utils/format';
import type { Locker } from '@gym/shared/types';
import type { LockerRangeValues } from '@gym/shared/validation/lockers';
import { LockerRangeDrawer } from './LockerRangeDrawer';

export const LockersPage: React.FC = () => {
  const { activeLocations } = useGymLocations();
  const { settings } = useAccessSettings();
  const { confirm, dialog } = useConfirm();
  const [locationId, setLocationId] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    lockers,
    isLoading,
    error,
    addLockers,
    setLockerActive,
    deleteLocker,
  } = useLockers(locationId || undefined);

  const hasSeveralLocations = activeLocations.length > 1;
  const defaultLocationId = locationId || activeLocations[0]?.id || '';

  const onSubmit = async (values: LockerRangeValues): Promise<void> => {
    try {
      await addLockers.mutateAsync(values);
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<Locker>[] = [
    {
      key: 'number',
      header: t('Locker'),
      primary: true,
      sortValue: (locker) => locker.number,
      searchValue: (locker) => locker.number,
      cell: (locker) => (
        <span className="font-semibold tabular-nums text-bone">
          {locker.number}
        </span>
      ),
    },
    ...(hasSeveralLocations
      ? [
          {
            key: 'location',
            header: t('Gym'),
            sortValue: (locker: Locker) => locker.locationName,
            cell: (locker: Locker) => locker.locationName,
          } satisfies Column<Locker>,
        ]
      : []),
    {
      key: 'status',
      header: t('Status'),
      sortValue: (locker) => (!locker.isActive ? 2 : locker.occupiedBy ? 1 : 0),
      searchValue: (locker) => locker.occupiedBy?.clientName ?? '',
      cell: (locker) =>
        !locker.isActive ? (
          <Badge tone="warning">{t('Out of service')}</Badge>
        ) : locker.occupiedBy ? (
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{t('In use')}</Badge>
            <span className="text-sm text-bone/70">
              {t('{{name}} since {{time}}', {
                name: locker.occupiedBy.clientName,
                time: formatTime(locker.occupiedBy.since),
              })}
            </span>
          </span>
        ) : (
          <Badge tone="success">{t('Free')}</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (locker) => (
        <>
          <Button
            size="sm"
            variant={locker.isActive ? 'warning' : 'success'}
            disabled={setLockerActive.isPending}
            onClick={() =>
              setLockerActive.mutate({
                lockerId: locker.id,
                isActive: !locker.isActive,
              })
            }
          >
            {locker.isActive ? t('Out of service') : t('Back in service')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            aria-label={t('Remove locker {{number}}', {
              number: locker.number,
            })}
            disabled={deleteLocker.isPending}
            onClick={() =>
              confirm({
                title: t('Remove locker {{number}}?', {
                  number: locker.number,
                }),
                description: t('The locker is deleted from the list.'),
                confirmLabel: t('Remove locker'),
                tone: 'danger',
                onConfirm: () => deleteLocker.mutate(locker.id),
              })
            }
          />
        </>
      ),
    },
  ];

  const table = useTableController({ rows: lockers, columns });
  const inUse = lockers.filter((locker) => locker.occupiedBy).length;

  return (
    <>
      <PageHeader
        eyebrow={t('Operations')}
        title={t('Lockers')}
        description={
          settings.lockersUseCard
            ? t('Lockers are locked with the member card.')
            : t('Lockers are locked with a key or padlock.')
        }
        actions={
          <Button
            icon="plus"
            disabled={activeLocations.length === 0}
            onClick={() => {
              addLockers.reset();
              setIsDrawerOpen(true);
            }}
          >
            {t('Add lockers')}
          </Button>
        }
      />

      {!settings.lockersEnabled ? (
        <Alert tone="warning" className="mb-4">
          {t('Lockers are turned off, so members cannot take one.')}{' '}
          <Link to="/access-settings" className="underline">
            {t('Open access settings')}
          </Link>
        </Alert>
      ) : null}
      {setLockerActive.error ? (
        <Alert className="mb-4">{setLockerActive.error.message}</Alert>
      ) : null}
      {deleteLocker.error ? (
        <Alert className="mb-4">{deleteLocker.error.message}</Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-bone/60">
          {t('{{used}} of {{total}} lockers in use', {
            used: inUse,
            total: lockers.length,
          })}
        </p>
        {hasSeveralLocations ? (
          <select
            aria-label={t('Gym')}
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className={`${fieldInputClass} w-auto`}
          >
            <option value="">{t('All gyms')}</option>
            {activeLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <Table
        controller={table}
        rowKey={(locker) => locker.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search lockers')}
        emptyTitle={t('No lockers yet')}
        emptyHint={t('Add the lockers of your changing room.')}
      />

      <LockerRangeDrawer
        isOpen={isDrawerOpen}
        locations={activeLocations}
        locationId={defaultLocationId}
        isPending={addLockers.isPending}
        serverError={addLockers.error ? addLockers.error.message : null}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      {dialog}
    </>
  );
};
