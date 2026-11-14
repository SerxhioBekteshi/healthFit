import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { Drawer } from '@/components/ui/Drawer';
import { t } from '@/i18n';
import type { GymLocation } from '@gym/shared/types';
import {
  lockerRangeSchema,
  type LockerRangeValues,
} from '@gym/shared/validation/lockers';

interface LockerRangeDrawerProps {
  isOpen: boolean;
  locations: GymLocation[];
  // Location selected on the page; the drawer starts with it.
  locationId: string;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: LockerRangeValues) => Promise<void>;
  onClose: () => void;
}

export const LockerRangeDrawer: React.FC<LockerRangeDrawerProps> = ({
  isOpen,
  locations,
  locationId,
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
  } = useForm<LockerRangeValues>({ resolver: zodResolver(lockerRangeSchema) });

  useEffect(() => {
    if (isOpen) reset({ locationId, prefix: '', from: 1, to: 20 });
  }, [isOpen, locationId, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={t('Add Lockers')}
      description={t(
        'Add a row of numbered lockers, for example 1 to 60. Numbers that already exist are kept.'
      )}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={t('Add lockers')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {locations.length > 1 ? (
          <FormField
            id="lockerLocation"
            label={t('Gym')}
            error={errors.locationId?.message}
          >
            <select
              id="lockerLocation"
              className={fieldInputClass}
              {...register('locationId')}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </FormField>
        ) : (
          <input type="hidden" {...register('locationId')} />
        )}

        <FormField
          id="lockerPrefix"
          label={t('Prefix (optional)')}
          error={errors.prefix?.message}
          hint={t('For example M for M1, M2 in the men changing room.')}
        >
          <input
            id="lockerPrefix"
            maxLength={4}
            className={`${fieldInputClass} uppercase`}
            {...register('prefix')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="lockerFrom"
            label={t('From number')}
            error={errors.from?.message}
          >
            <input
              id="lockerFrom"
              type="number"
              min={0}
              className={fieldInputClass}
              {...register('from', { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            id="lockerTo"
            label={t('To number')}
            error={errors.to?.message}
          >
            <input
              id="lockerTo"
              type="number"
              min={0}
              className={fieldInputClass}
              {...register('to', { valueAsNumber: true })}
            />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
};
