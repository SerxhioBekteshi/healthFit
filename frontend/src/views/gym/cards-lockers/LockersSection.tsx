import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Table, type Column } from '@/components/ui/Table';
import { useConfirm } from '@/hooks/confirm';
import { useGenderSettings } from '@/hooks/gender-settings';
import { useGymLocations } from '@/hooks/gym-locations';
import { useLockerActions, useLockers } from '@/hooks/lockers';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { genderLabels, genders } from '@/utils/constants/labels';
import { formatTime } from '@/utils/format';
import type { Gender, Locker } from '@gym/shared/types';
import type { LockerRangeValues } from '@gym/shared/validation/lockers';
import { LockerRangeDrawer } from './LockerRangeDrawer';

// Changing-room lockers: add, free, take out of service, remove. A tab of Cards & lockers.
export const LockersSection: React.FC = () => {
  const { activeLocations } = useGymLocations();
  const { settings: genderSettings } = useGenderSettings();
  const { confirm, dialog } = useConfirm();
  const [locationId, setLocationId] = useState('');
  const [genderFilter, setGenderFilter] = useState<Gender | ''>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    lockers: allLockers,
    isLoading,
    error,
    addLockers,
    setLockerActive,
    deleteLocker,
  } = useLockers(locationId || undefined);
  const { releaseLocker } = useLockerActions();

  const sameLockers = genderSettings.sameLockersForGenders;
  // Mirrored lockers repeat every number in both rooms, so one room is always shown.
  const activeGender: Gender | '' = sameLockers
    ? genderFilter || 'male'
    : genderFilter;
  const lockers = activeGender
    ? allLockers.filter((locker) => locker.gender === activeGender)
    : allLockers;
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
    {
      key: 'gender',
      header: t('Changing room'),
      sortValue: (locker) => locker.gender,
      cell: (locker) => genderLabels[locker.gender],
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
          {locker.occupiedBy ? (
            <Button
              size="sm"
              variant="ghost"
              loading={releaseLocker.isPending}
              onClick={() =>
                releaseLocker.mutate({ code: locker.occupiedBy?.clientId })
              }
            >
              {t('Release')}
            </Button>
          ) : null}
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
      <p className="mb-4 text-sm text-bone/60">
        {t('{{used}} of {{total}} lockers in use', {
          used: inUse,
          total: lockers.length,
        })}
      </p>

      {setLockerActive.error ? (
        <Alert className="mb-4">{setLockerActive.error.message}</Alert>
      ) : null}
      {deleteLocker.error ? (
        <Alert className="mb-4">{deleteLocker.error.message}</Alert>
      ) : null}
      {releaseLocker.error ? (
        <Alert className="mb-4">{releaseLocker.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(locker) => locker.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search lockers')}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label={t('Changing room')}
              value={activeGender}
              onChange={(value) => {
                setGenderFilter(value);
                table.setPage(0);
              }}
              options={[
                ...(sameLockers
                  ? []
                  : [{ value: '' as const, label: t('Both changing rooms') }]),
                ...genders.map((value) => ({
                  value,
                  label: genderLabels[value],
                })),
              ]}
            />
            {hasSeveralLocations ? (
              <FilterSelect
                label={t('Gym')}
                value={locationId}
                onChange={(value) => {
                  setLocationId(value);
                  table.setPage(0);
                }}
                options={[
                  { value: '', label: t('All gyms') },
                  ...activeLocations.map((location) => ({
                    value: location.id,
                    label: location.name,
                  })),
                ]}
              />
            ) : null}
          </div>
        }
        action={
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
        emptyTitle={t('No lockers yet')}
        emptyHint={t('Add the lockers of your changing room.')}
      />

      <LockerRangeDrawer
        isOpen={isDrawerOpen}
        locations={activeLocations}
        locationId={defaultLocationId}
        gender={activeGender || 'male'}
        sameForBothGenders={sameLockers}
        isPending={addLockers.isPending}
        serverError={addLockers.error ? addLockers.error.message : null}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      {dialog}
    </>
  );
};
