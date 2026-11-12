import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { GymClosure } from '@gym/shared/types';
import {
  gymClosureFormSchema,
  type GymClosureFormValues,
} from '@gym/shared/validation/gym-closures';

interface GymClosureFormDrawerProps {
  isOpen: boolean;
  closure: GymClosure | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: GymClosureFormValues) => Promise<void>;
  onClose: () => void;
}

const today = (): string => new Date().toISOString().slice(0, 10);

export const GymClosureFormDrawer: React.FC<GymClosureFormDrawerProps> = ({
  isOpen,
  closure,
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
  } = useForm<GymClosureFormValues>({
    resolver: zodResolver(gymClosureFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        closure
          ? {
              startDate: closure.startDate,
              endDate: closure.endDate,
              reason: closure.reason,
            }
          : { startDate: today(), endDate: today(), reason: '' }
      );
    }
  }, [closure, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={closure ? t('Edit Closure') : t('Add Closure')}
      description={t('Check-ins are blocked on these dates.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={closure ? t('Update closure') : t('Add closure')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="startDate"
            label={t('Start Date')}
            error={errors.startDate?.message}
          >
            <input
              id="startDate"
              type="date"
              className={fieldInputClass}
              {...register('startDate')}
            />
          </FormField>
          <FormField
            id="endDate"
            label={t('End Date')}
            error={errors.endDate?.message}
          >
            <input
              id="endDate"
              type="date"
              className={fieldInputClass}
              {...register('endDate')}
            />
          </FormField>
        </div>

        <FormField
          id="reason"
          label={t('Reason')}
          error={errors.reason?.message}
        >
          <input
            id="reason"
            className={fieldInputClass}
            placeholder={t('New Year holidays')}
            {...register('reason')}
          />
        </FormField>
      </form>
    </Drawer>
  );
};
