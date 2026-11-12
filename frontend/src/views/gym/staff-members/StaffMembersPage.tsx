import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useStaffMembers } from '@/hooks/staff-members';
import { useConfirm } from '@/hooks/confirm';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import type { StaffMember } from '@gym/shared/types';
import type { StaffMemberFormValues } from '@gym/shared/validation/staff-members';
import { StaffMemberFormDrawer } from './StaffMemberFormDrawer';

export const StaffMembersPage: React.FC = () => {
  const {
    staffMembers,
    isLoading,
    error,
    createStaffMember,
    updateStaffMember,
    setStaffMemberActive,
  } = useStaffMembers();
  const { confirm, dialog } = useConfirm();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const saveMutation = editing ? updateStaffMember : createStaffMember;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (staffMember: StaffMember | null): void => {
    createStaffMember.reset();
    updateStaffMember.reset();
    setEditing(staffMember);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: StaffMemberFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateStaffMember.mutateAsync({
          staffMemberId: editing.id,
          input: values,
        });
      } else {
        await createStaffMember.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: t('Staff member'),
      primary: true,
      sortValue: (member) => member.fullName,
      searchValue: (member) => member.fullName,
      cell: (member) => (
        <div className="flex items-center gap-3">
          <Avatar name={member.fullName} size="sm" />
          <span className="font-semibold text-bone">{member.fullName}</span>
        </div>
      ),
    },
    {
      key: 'specialty',
      header: t('Specialty'),
      searchValue: (member) => member.specialty,
      cell: (member) => member.specialty || '—',
    },
    {
      key: 'status',
      header: t('Status'),
      sortValue: (member) => (member.isActive ? 0 : 1),
      searchValue: (member) => (member.isActive ? t('Active') : t('Inactive')),
      cell: (member) => (
        <Badge tone={member.isActive ? 'success' : 'neutral'}>
          {member.isActive ? t('Active') : t('Inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (member) => (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon="pencil"
            onClick={() => openDrawer(member)}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant={member.isActive ? 'warning' : 'success'}
            disabled={setStaffMemberActive.isPending}
            onClick={() =>
              member.isActive
                ? confirm({
                    title: t('Deactivate {{name}}?', {
                      name: member.fullName,
                    }),
                    description: t(
                      'They can no longer be assigned to classes. Classes they already teach keep them as the instructor.'
                    ),
                    confirmLabel: t('Deactivate'),
                    tone: 'warning',
                    onConfirm: () =>
                      setStaffMemberActive.mutate({
                        staffMemberId: member.id,
                        isActive: false,
                      }),
                  })
                : setStaffMemberActive.mutate({
                    staffMemberId: member.id,
                    isActive: true,
                  })
            }
          >
            {member.isActive ? t('Deactivate') : t('Activate')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({ rows: staffMembers, columns });

  return (
    <>
      <PageHeader
        title={t('Your')}
        accent={t('staff')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Add staff member')}
          </Button>
        }
      />

      {setStaffMemberActive.error ? (
        <Alert className="mb-4">{setStaffMemberActive.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(member) => member.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search staff')}
        emptyTitle={t('No staff yet')}
        emptyHint={t(
          'Add your trainers and instructors to assign them to classes.'
        )}
      />

      <StaffMemberFormDrawer
        isOpen={isDrawerOpen}
        staffMember={editing}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      {dialog}
    </>
  );
};
