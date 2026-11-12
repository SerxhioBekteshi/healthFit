import React, { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { Client, MembershipPlan } from '@gym/shared/types';
import { genderLabels, weeklyVisitsLabel } from '@/utils/constants/labels';
import { formatDay, formatMoney } from '@/utils/format';
import {
  createMembershipSchema,
  type CreateMembershipValues,
} from '@gym/shared/validation/memberships';

export interface AssignDefaults {
  clientId?: string;
  planId?: string;
  startDate?: string;
  // Renewing a membership: same drawer, wording for a renewal.
  renewing?: boolean;
}

interface AssignMembershipDrawerProps {
  isOpen: boolean;
  clients: Client[];
  plans: MembershipPlan[];
  // Pre-fills the form, for example the client of the row it was opened from.
  defaults?: AssignDefaults;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: CreateMembershipValues) => Promise<void>;
  onClose: () => void;
}

const today = (): string => new Date().toISOString().slice(0, 10);

// The one place where a membership is sold: assign a new one or renew an old one.
export const AssignMembershipDrawer: React.FC<AssignMembershipDrawerProps> = ({
  isOpen,
  clients,
  plans,
  defaults,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMembershipValues>({
    resolver: zodResolver(createMembershipSchema),
  });
  const renewing = defaults?.renewing ?? false;

  // Plans are sold per gender, so only the selected client's plans are offered.
  const clientId = watch('clientId');
  const startDate = watch('startDate');
  const clientGender = clients.find((client) => client.id === clientId)?.gender;
  const eligiblePlans = useMemo(
    () =>
      clientGender
        ? plans.filter((plan) => plan.gender === clientGender)
        : plans,
    [plans, clientGender]
  );

  useEffect(() => {
    if (isOpen) {
      reset({
        clientId: defaults?.clientId ?? clients[0]?.id ?? '',
        planId: '',
        startDate: defaults?.startDate ?? today(),
        paymentMethod: 'cash',
      });
    }
  }, [isOpen, clients, defaults, reset]);

  useEffect(() => {
    if (isOpen) {
      const preferred =
        eligiblePlans.find((plan) => plan.id === defaults?.planId) ??
        eligiblePlans[0];
      setValue('planId', preferred?.id ?? '');
    }
  }, [isOpen, clientId, eligiblePlans, defaults, setValue]);

  return (
    <Drawer
      isOpen={isOpen}
      title={renewing ? t('Renew Membership') : t('Assign Membership')}
      description={
        renewing
          ? t(
              'Sell another period to this client. Pick the plan; it starts the day after their last membership ends.'
            )
          : t('Sell a membership to a client at the counter.')
      }
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={renewing ? t('Renew membership') : t('Assign membership')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="membership-client"
          label={t('Client')}
          error={errors.clientId?.message}
        >
          <select
            id="membership-client"
            className={fieldInputClass}
            {...register('clientId')}
          >
            <option value="">{t('Select a client...')}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName} ({client.email})
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="membership-plan"
          label={t('Plan')}
          error={errors.planId?.message}
        >
          <select
            id="membership-plan"
            className={fieldInputClass}
            {...register('planId')}
          >
            <option value="">{t('Select a plan...')}</option>
            {eligiblePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({genderLabels[plan.gender]}
                {plan.weeklyVisits > 0
                  ? `, ${weeklyVisitsLabel(plan.weeklyVisits)}`
                  : ''}
                ) — {formatMoney(plan.price)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="membership-start"
          label={t('Start Date')}
          error={errors.startDate?.message}
        >
          {renewing ? (
            <>
              <input type="hidden" {...register('startDate')} />
              <p className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-bone">
                {startDate ? formatDay(startDate) : '—'}
              </p>
            </>
          ) : (
            <input
              id="membership-start"
              type="date"
              className={fieldInputClass}
              {...register('startDate')}
            />
          )}
        </FormField>

        <p className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-bone/70">
          {t(
            'Paid in cash at the counter, so the membership is paid right away. If the client already has a membership running, this one is queued and starts the day after the last one ends. Members who pay by card or from their balance subscribe in their own app.'
          )}
        </p>
      </form>
    </Drawer>
  );
};
