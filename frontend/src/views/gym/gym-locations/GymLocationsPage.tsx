import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useGymLocations } from '@/hooks/gym-locations';
import { useTableController } from '@/hooks/table';
import type { GymLocation } from '@gym/shared/types';
import type { GymLocationFormValues } from '@gym/shared/validation/gym-locations';
import { t } from '@/i18n';
import { locationMapLink } from '@/utils/maps';
import { GymLocationFormDrawer } from './GymLocationFormDrawer';

export const GymLocationsPage: React.FC = () => {
  const {
    locations,
    isLoading,
    error,
    createLocation,
    updateLocation,
    setLocationActive,
  } = useGymLocations();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<GymLocation | null>(null);

  const saveMutation = editing ? updateLocation : createLocation;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (location: GymLocation | null): void => {
    createLocation.reset();
    updateLocation.reset();
    setEditing(location);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: GymLocationFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateLocation.mutateAsync({
          locationId: editing.id,
          input: values,
        });
      } else {
        await createLocation.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<GymLocation>[] = [
    {
      key: 'name',
      header: t('Gym'),
      primary: true,
      sortValue: (location) => location.name,
      searchValue: (location) => location.name,
      cell: (location) => (
        <span className="font-semibold text-bone">{location.name}</span>
      ),
    },
    {
      key: 'address',
      header: t('Location'),
      sortValue: (location) => location.address,
      searchValue: (location) => location.address,
      cell: (location) => location.address,
    },
    {
      key: 'phone',
      header: t('Phone'),
      searchValue: (location) => location.phone,
      cell: (location) =>
        location.phone || <span className="text-bone/40">-</span>,
    },
    {
      key: 'map',
      header: t('Map'),
      searchValue: () => '',
      cell: (location) => {
        const link = locationMapLink(location);
        return link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-signal hover:underline"
          >
            {t('Open map')}
          </a>
        ) : (
          <span className="text-warn">{t('Pin not set')}</span>
        );
      },
    },
    {
      key: 'status',
      header: t('Status'),
      sortValue: (location) => (location.isActive ? 0 : 1),
      searchValue: (location) => (location.isActive ? t('Open') : t('Closed')),
      cell: (location) => (
        <Badge tone={location.isActive ? 'success' : 'neutral'}>
          {location.isActive ? t('Open to members') : t('Closed')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (location) => (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon="pencil"
            onClick={() => openDrawer(location)}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant={location.isActive ? 'warning' : 'success'}
            disabled={setLocationActive.isPending}
            onClick={() =>
              setLocationActive.mutate({
                locationId: location.id,
                isActive: !location.isActive,
              })
            }
          >
            {location.isActive ? t('Close') : t('Reopen')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({ rows: locations, columns });

  return (
    <>
      <PageHeader
        title={t('My')}
        accent={t('gyms')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Add gym')}
          </Button>
        }
      />

      {setLocationActive.error ? (
        <Alert className="mb-4">{setLocationActive.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(location) => location.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search gyms')}
        emptyTitle={t('No gyms yet')}
        emptyHint={t('Add the places where your members can train.')}
      />

      <GymLocationFormDrawer
        isOpen={isDrawerOpen}
        location={editing}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
