import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useGymClosures } from '@/hooks/gym-closures';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { daysUntil } from '@/utils/memberships';
import type { GymClosure } from '@gym/shared/types';
import type { GymClosureFormValues } from '@gym/shared/validation/gym-closures';
import { GymClosureFormDrawer } from './GymClosureFormDrawer';

const isPast = (closure: GymClosure): boolean => daysUntil(closure.endDate) < 0;

export const GymClosuresPage: React.FC = () => {
  const {
    closures,
    isLoading,
    error,
    createClosure,
    updateClosure,
    deleteClosure,
  } = useGymClosures();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<GymClosure | null>(null);
  const [deleting, setDeleting] = useState<GymClosure | null>(null);

  const saveMutation = editing ? updateClosure : createClosure;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (closure: GymClosure | null): void => {
    createClosure.reset();
    updateClosure.reset();
    setEditing(closure);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: GymClosureFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateClosure.mutateAsync({
          closureId: editing.id,
          input: values,
        });
      } else {
        await createClosure.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const onDelete = (): void => {
    if (deleting) deleteClosure.mutate(deleting.id);
    setDeleting(null);
  };

  const columns: Column<GymClosure>[] = [
    {
      key: 'reason',
      header: t('Reason'),
      primary: true,
      sortValue: (closure) => closure.reason,
      searchValue: (closure) => closure.reason,
      cell: (closure) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-bone">{closure.reason}</span>
          {isPast(closure) ? (
            <Badge tone="danger">{t('Ended - remove')}</Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: 'from',
      header: t('From'),
      sortValue: (closure) => closure.startDate,
      searchValue: (closure) => closure.startDate,
      cell: (closure) => (
        <span className="tabular-nums">{closure.startDate}</span>
      ),
    },
    {
      key: 'to',
      header: t('To'),
      searchValue: (closure) => closure.endDate,
      cell: (closure) => (
        <span className="tabular-nums">{closure.endDate}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (closure) => (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon="pencil"
            onClick={() => openDrawer(closure)}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            disabled={deleteClosure.isPending}
            onClick={() => setDeleting(closure)}
          >
            {t('Remove')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({ rows: closures, columns });

  return (
    <>
      <PageHeader
        title={t('Holidays &')}
        accent={t('closures')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Add closure')}
          </Button>
        }
      />

      {deleteClosure.error ? (
        <Alert className="mb-4">{deleteClosure.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(closure) => closure.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search closures')}
        rowClassName={(closure) => (isPast(closure) ? 'bg-danger/[0.06]' : '')}
        emptyTitle={t('No closures registered')}
        emptyHint={t('Add dates when the gym is closed.')}
      />

      <GymClosureFormDrawer
        isOpen={isDrawerOpen}
        closure={editing}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      <Modal
        isOpen={deleting !== null}
        size="sm"
        title={t('Remove closure')}
        description={
          deleting
            ? t('Remove the closure "{{reason}}"?', { reason: deleting.reason })
            : undefined
        }
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              {t('Remove')}
            </Button>
          </>
        }
      />
    </>
  );
};
