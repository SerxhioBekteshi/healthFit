import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { Gym, GymSubscription } from '@gym/shared/types';
import { subscriptionCycleLabels } from '@/utils/constants/labels';
import {
  createGymSubscriptionSchema,
  updateGymSubscriptionSchema,
  type CreateGymSubscriptionValues,
} from '@gym/shared/validation/gym-subscriptions';

interface GymSubscriptionFormDrawerProps {
  isOpen: boolean;
  subscription: GymSubscription | null;
  // Gyms without a subscription yet; one subscription per gym.
  availableGyms: Gym[];
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: CreateGymSubscriptionValues) => Promise<void>;
  onClose: () => void;
}

const today = (): string => new Date().toISOString().slice(0, 10);

export const GymSubscriptionFormDrawer: React.FC<
  GymSubscriptionFormDrawerProps
> = ({
  isOpen,
  subscription,
  availableGyms,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const isEditing = subscription !== null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGymSubscriptionValues>({
    // The edit form omits gym and start date, so its resolver is widened to the create shape.
    resolver: zodResolver(
      isEditing ? updateGymSubscriptionSchema : createGymSubscriptionSchema
    ) as unknown as Resolver<CreateGymSubscriptionValues>,
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        subscription
          ? {
              gymId: subscription.gymId,
              planName: subscription.planName,
              cycle: subscription.cycle,
              price: subscription.price,
              startDate: subscription.startDate,
            }
          : {
              gymId: availableGyms[0]?.id ?? '',
              planName: 'Pro Monthly',
              cycle: 'monthly',
              price: 99,
              startDate: today(),
            }
      );
    }
  }, [subscription, availableGyms, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={isEditing ? t('Edit Subscription') : t('Create Subscription')}
      description={t('Plan changes apply to the next payment.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={
        isEditing ? t('Update subscription') : t('Create subscription')
      }
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {isEditing ? (
          <p className="text-sm text-bone/70">
            {t('Gym:')}{' '}
            <span className="font-semibold text-bone">
              {subscription.gymName}
            </span>
          </p>
        ) : (
          <FormField id="gymId" label={t('Gym')} error={errors.gymId?.message}>
            <select
              id="gymId"
              className={fieldInputClass}
              {...register('gymId')}
            >
              <option value="">{t('Select a gym...')}</option>
              {availableGyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField
          id="planName"
          label={t('Plan Name')}
          error={errors.planName?.message}
        >
          <input
            id="planName"
            className={fieldInputClass}
            {...register('planName')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="cycle"
            label={t('Cycle')}
            error={errors.cycle?.message}
          >
            <select
              id="cycle"
              className={fieldInputClass}
              {...register('cycle')}
            >
              {Object.entries(subscriptionCycleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            id="price"
            label={t('Price')}
            error={errors.price?.message}
          >
            <input
              id="price"
              type="number"
              min={0}
              step="0.01"
              className={fieldInputClass}
              {...register('price', { valueAsNumber: true })}
            />
          </FormField>
        </div>

        {isEditing ? null : (
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
        )}
      </form>
    </Drawer>
  );
};
