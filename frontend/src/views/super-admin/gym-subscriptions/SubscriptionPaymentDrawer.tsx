import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { msg, t, translated } from '@/i18n';
import { formatDay, formatMoney } from '@/utils/format';
import { subscriptionCycleLabels } from '@/utils/constants/labels';
import type { GymSubscription } from '@gym/shared/types';
import {
  subscriptionPaymentSchema,
  type SubscriptionPaymentValues,
} from '@gym/shared/validation/gym-subscriptions';

interface SubscriptionPaymentDrawerProps {
  subscription: GymSubscription | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: SubscriptionPaymentValues) => Promise<void>;
  onClose: () => void;
}

const methodLabels = translated<SubscriptionPaymentValues['paymentMethod']>({
  card: msg('Card'),
  online: msg('Online'),
  bank_transfer: msg('Bank transfer (already received)'),
});

export const SubscriptionPaymentDrawer: React.FC<
  SubscriptionPaymentDrawerProps
> = ({ subscription, isPending, serverError, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscriptionPaymentValues>({
    resolver: zodResolver(subscriptionPaymentSchema),
    defaultValues: { paymentMethod: 'card' },
  });

  useEffect(() => {
    if (subscription) {
      reset({ paymentMethod: 'card' });
    }
  }, [subscription, reset]);

  return (
    <Drawer
      isOpen={subscription !== null}
      title={t('Record Payment')}
      description={
        subscription ? `${subscription.gymName} — ${subscription.planName}` : ''
      }
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={t('Record payment')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {subscription ? (
          <p className="text-sm text-bone/70">
            {t('This settles one {{cycle}} period at {{price}}.', {
              cycle: subscriptionCycleLabels[subscription.cycle],
              price: formatMoney(subscription.price),
            })}{' '}
            {t('Paid through {{date}}.', {
              date: formatDay(subscription.currentPeriodEnd),
            })}
          </p>
        ) : null}

        <FormField
          id="paymentMethod"
          label={t('Payment Method')}
          error={errors.paymentMethod?.message}
        >
          <select
            id="paymentMethod"
            className={fieldInputClass}
            {...register('paymentMethod')}
          >
            {Object.entries(methodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Drawer>
  );
};
