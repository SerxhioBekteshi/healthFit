import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { StaffMember } from '@gym/shared/types';
import {
  staffMemberFormSchema,
  type StaffMemberFormValues,
} from '@gym/shared/validation/staff-members';

interface StaffMemberFormDrawerProps {
  isOpen: boolean;
  staffMember: StaffMember | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: StaffMemberFormValues) => Promise<void>;
  onClose: () => void;
}

const emptyValues: StaffMemberFormValues = { fullName: '', specialty: '' };

export const StaffMemberFormDrawer: React.FC<StaffMemberFormDrawerProps> = ({
  isOpen,
  staffMember,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffMemberFormValues>({
    resolver: zodResolver(staffMemberFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        staffMember
          ? {
              fullName: staffMember.fullName,
              specialty: staffMember.specialty,
            }
          : emptyValues
      );
    }
  }, [staffMember, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={staffMember ? t('Edit Staff Member') : t('Add Staff Member')}
      description={t('Trainers and instructors you can assign to classes.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={
        staffMember ? t('Update staff member') : t('Add staff member')
      }
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="fullName"
          label={t('Name')}
          error={errors.fullName?.message}
        >
          <input
            id="fullName"
            className={fieldInputClass}
            {...register('fullName')}
          />
        </FormField>

        <FormField
          id="specialty"
          label={t('Specialty')}
          error={errors.specialty?.message}
        >
          <input
            id="specialty"
            className={fieldInputClass}
            placeholder={t('Abs & core, Aerobics, Personal training...')}
            {...register('specialty')}
          />
        </FormField>
      </form>
    </Drawer>
  );
};
