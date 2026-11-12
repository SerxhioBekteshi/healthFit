import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { Gym, GymAdmin } from '@gym/shared/types';
import {
  createGymAdminSchema,
  updateGymAdminSchema,
  type CreateGymAdminValues,
} from '@gym/shared/validation/gym-admins';

interface GymAdminFormDrawerProps {
  isOpen: boolean;
  gymAdmin: GymAdmin | null;
  gyms: Gym[];
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: CreateGymAdminValues) => Promise<void>;
  onClose: () => void;
}

const emptyValues: CreateGymAdminValues = {
  fullName: '',
  email: '',
  password: '',
  assignedGymId: '',
};

export const GymAdminFormDrawer: React.FC<GymAdminFormDrawerProps> = ({
  isOpen,
  gymAdmin,
  gyms,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const isEditing = gymAdmin !== null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGymAdminValues>({
    resolver: zodResolver(
      isEditing ? updateGymAdminSchema : createGymAdminSchema
    ),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        gymAdmin
          ? {
              fullName: gymAdmin.fullName,
              email: gymAdmin.email,
              password: '',
              assignedGymId: gymAdmin.assignedGymId,
            }
          : emptyValues
      );
    }
  }, [gymAdmin, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={isEditing ? t('Edit Gym Admin') : t('Create Gym Admin')}
      description={t('Fill in gym admin details and save your changes.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={isEditing ? t('Update gym admin') : t('Create gym admin')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="fullName"
          label={t('Full Name')}
          error={errors.fullName?.message}
        >
          <input
            id="fullName"
            className={fieldInputClass}
            {...register('fullName')}
          />
        </FormField>

        <FormField id="email" label={t('Email')} error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="off"
            className={fieldInputClass}
            {...register('email')}
          />
        </FormField>

        <FormField
          id="password"
          label={isEditing ? t('New Password (optional)') : t('Password')}
          error={errors.password?.message}
        >
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={fieldInputClass}
            {...register('password')}
          />
        </FormField>

        <FormField
          id="assignedGymId"
          label={t('Assigned Gym')}
          error={errors.assignedGymId?.message}
        >
          <select
            id="assignedGymId"
            className={fieldInputClass}
            {...register('assignedGymId')}
          >
            <option value="">{t('Select a gym...')}</option>
            {gyms.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.name}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Drawer>
  );
};
