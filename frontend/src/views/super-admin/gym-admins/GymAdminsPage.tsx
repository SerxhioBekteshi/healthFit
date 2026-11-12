import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useGymAdmins } from '@/hooks/gym-admins';
import { useGyms } from '@/hooks/gyms';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import type { GymAdmin } from '@gym/shared/types';
import type { CreateGymAdminValues } from '@gym/shared/validation/gym-admins';
import { GymAdminFormDrawer } from './GymAdminFormDrawer';

export const GymAdminsPage: React.FC = () => {
  const {
    gymAdmins,
    isLoading,
    error,
    createGymAdmin,
    updateGymAdmin,
    deleteGymAdmin,
  } = useGymAdmins();
  const { gyms } = useGyms();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<GymAdmin | null>(null);
  const [deleting, setDeleting] = useState<GymAdmin | null>(null);

  const saveMutation = editing ? updateGymAdmin : createGymAdmin;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (gymAdmin: GymAdmin | null): void => {
    createGymAdmin.reset();
    updateGymAdmin.reset();
    setEditing(gymAdmin);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: CreateGymAdminValues): Promise<void> => {
    try {
      if (editing) {
        await updateGymAdmin.mutateAsync({
          gymAdminId: editing.id,
          input: values,
        });
      } else {
        await createGymAdmin.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const onDelete = (): void => {
    if (deleting) deleteGymAdmin.mutate(deleting.id);
    setDeleting(null);
  };

  const columns: Column<GymAdmin>[] = [
    {
      key: 'name',
      header: t('Admin'),
      primary: true,
      sortValue: (item) => item.fullName,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-bone">{item.fullName}</p>
            <p className="truncate text-xs text-bone/45">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'gym',
      header: t('Gym'),
      sortValue: (item) => item.assignedGymName,
      cell: (item) => item.assignedGymName,
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (item) => (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon="pencil"
            onClick={() => openDrawer(item)}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            disabled={deleteGymAdmin.isPending}
            onClick={() => setDeleting(item)}
          >
            {t('Delete')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({ rows: gymAdmins, columns });

  return (
    <>
      <PageHeader
        title={t('Gym')}
        accent={t('admins')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Create gym admin')}
          </Button>
        }
      />

      {deleteGymAdmin.error ? (
        <Alert className="mb-4">{deleteGymAdmin.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(item) => item.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        emptyTitle={t('No gym admins yet')}
        emptyHint={t('Create an admin and assign them to a gym.')}
      />

      <GymAdminFormDrawer
        isOpen={isDrawerOpen}
        gymAdmin={editing}
        gyms={gyms}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      <Modal
        isOpen={deleting !== null}
        size="sm"
        title={t('Delete gym admin')}
        description={
          deleting
            ? t('Delete {{name}}?', { name: deleting.fullName })
            : undefined
        }
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              {t('Delete')}
            </Button>
          </>
        }
      />
    </>
  );
};
