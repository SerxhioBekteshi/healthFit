import React, { useMemo, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useClasses } from '@/hooks/classes';
import { useStaffMembers } from '@/hooks/staff-members';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { formatWeekdays } from '@/utils/constants/weekdays';
import type { GymClass } from '@gym/shared/types';
import type { ClassFormValues } from '@gym/shared/validation/classes';
import { ClassFormDrawer } from './ClassFormDrawer';

export const ClassesPage: React.FC = () => {
  const {
    classes,
    isLoading,
    error,
    createClass,
    updateClass,
    setClassActive,
    deleteClass,
  } = useClasses();
  const { staffMembers } = useStaffMembers();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<GymClass | null>(null);
  const [deleting, setDeleting] = useState<GymClass | null>(null);

  const saveMutation = editing ? updateClass : createClass;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  // The current instructor stays selectable even if they were deactivated.
  const assignable = useMemo(
    () =>
      staffMembers.filter(
        (member) => member.isActive || member.id === editing?.staffMemberId
      ),
    [staffMembers, editing]
  );

  const openDrawer = (gymClass: GymClass | null): void => {
    createClass.reset();
    updateClass.reset();
    setEditing(gymClass);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: ClassFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateClass.mutateAsync({ classId: editing.id, input: values });
      } else {
        await createClass.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const onDelete = (): void => {
    if (deleting) deleteClass.mutate(deleting.id);
    setDeleting(null);
  };

  const columns: Column<GymClass>[] = [
    {
      key: 'name',
      header: t('Class'),
      primary: true,
      sortValue: (item) => item.name,
      searchValue: (item) => `${item.name} ${item.description}`,
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-bone">{item.name}</p>
          {item.description ? (
            <p className="max-w-xs truncate text-xs text-bone/45">
              {item.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'days',
      header: t('Days'),
      sortValue: (item) => item.weekdays[0] ?? 0,
      searchValue: (item) => formatWeekdays(item.weekdays),
      cell: (item) => formatWeekdays(item.weekdays),
    },
    {
      key: 'time',
      header: t('Time'),
      sortValue: (item) => item.startTime,
      searchValue: (item) => `${item.startTime} ${item.endTime}`,
      cell: (item) => (
        <span className="tabular-nums">
          {item.startTime} - {item.endTime}
        </span>
      ),
    },
    {
      key: 'instructor',
      header: t('Instructor'),
      sortValue: (item) => item.staffMemberName ?? '',
      searchValue: (item) => item.staffMemberName ?? t('Not assigned'),
      cell: (item) =>
        item.staffMemberName ?? (
          <span className="text-warn">{t('Not assigned')}</span>
        ),
    },
    {
      key: 'status',
      header: t('Status'),
      sortValue: (item) => (item.isActive ? 0 : 1),
      searchValue: (item) =>
        item.isActive ? t('On the timetable') : t('Hidden'),
      cell: (item) => (
        <Badge tone={item.isActive ? 'success' : 'neutral'}>
          {item.isActive ? t('On the timetable') : t('Hidden')}
        </Badge>
      ),
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
            variant={item.isActive ? 'warning' : 'success'}
            disabled={setClassActive.isPending}
            onClick={() =>
              setClassActive.mutate({
                classId: item.id,
                isActive: !item.isActive,
              })
            }
          >
            {item.isActive ? t('Hide') : t('Show')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            disabled={deleteClass.isPending}
            onClick={() => setDeleting(item)}
          >
            {t('Remove')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({ rows: classes, columns });

  const actionError = setClassActive.error ?? deleteClass.error;

  return (
    <>
      <PageHeader
        title={t('Class')}
        accent={t('timetable')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Add class')}
          </Button>
        }
      />

      {actionError ? (
        <Alert className="mb-4">{actionError.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(item) => item.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search classes')}
        emptyTitle={t('No classes yet')}
        emptyHint={t(
          'Add abs, aerobics or any class and choose the days and time.'
        )}
      />

      <ClassFormDrawer
        isOpen={isDrawerOpen}
        gymClass={editing}
        staffMembers={assignable}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      <Modal
        isOpen={deleting !== null}
        size="sm"
        title={t('Remove class')}
        description={
          deleting
            ? t('Remove "{{name}}" from the timetable?', {
                name: deleting.name,
              })
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
