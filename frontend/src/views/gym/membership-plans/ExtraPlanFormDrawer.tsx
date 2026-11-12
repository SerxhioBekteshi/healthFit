import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { getCurrency, t } from '@/i18n';
import type { Gender, MembershipPlan } from '@gym/shared/types';
import {
  genderLabels,
  genders,
  planTypeLabels,
} from '@/utils/constants/labels';
import {
  membershipPlanFormSchema,
  type MembershipPlanFormValues,
} from '@gym/shared/validation/membership-plans';

interface ExtraPlanFormDrawerProps {
  isOpen: boolean;
  plan: MembershipPlan | null;
  // Pre-selected gender for a new extra, usually the tab the admin is on.
  defaultGender: Gender;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: MembershipPlanFormValues) => Promise<void>;
  onClose: () => void;
}

const extraTypes = ['visit_based', 'personal_training'] as const;

const emptyValues: MembershipPlanFormValues = {
  name: '',
  type: 'visit_based',
  durationDays: 1,
  visitCount: 1,
  gender: 'male',
  // Extras are not capped per week.
  weeklyVisits: 0,
  price: 0,
};

// Daily pass, visit packs and personal training. The standard terms live in the price table.
export const ExtraPlanFormDrawer: React.FC<ExtraPlanFormDrawerProps> = ({
  isOpen,
  plan,
  defaultGender,
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
    formState: { errors },
  } = useForm<MembershipPlanFormValues>({
    resolver: zodResolver(membershipPlanFormSchema),
    defaultValues: emptyValues,
  });
  const isVisitBased = watch('type') === 'visit_based';

  useEffect(() => {
    if (isOpen) {
      reset(
        plan
          ? {
              name: plan.name,
              type: plan.type,
              durationDays: plan.durationDays,
              visitCount: plan.visitCount,
              gender: plan.gender,
              weeklyVisits: 0,
              price: plan.price,
            }
          : { ...emptyValues, gender: defaultGender }
      );
    }
  }, [plan, isOpen, defaultGender, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={plan ? t('Edit extra') : t('Add extra')}
      description={t(
        'Daily passes, visit packs and personal training. Changes apply to new memberships only.'
      )}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={plan ? t('Update extra') : t('Add extra')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField id="gender" label={t('For')} error={errors.gender?.message}>
          <select
            id="gender"
            className={fieldInputClass}
            {...register('gender')}
          >
            {genders.map((value) => (
              <option key={value} value={value}>
                {genderLabels[value]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="type" label={t('Type')} error={errors.type?.message}>
          <select id="type" className={fieldInputClass} {...register('type')}>
            {extraTypes.map((value) => (
              <option key={value} value={value}>
                {planTypeLabels[value]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="name" label={t('Name')} error={errors.name?.message}>
          <input
            id="name"
            className={fieldInputClass}
            placeholder={t('e.g. Daily pass')}
            {...register('name')}
          />
        </FormField>

        <FormField
          id="durationDays"
          label={t('Valid for (days)')}
          error={errors.durationDays?.message}
        >
          <input
            id="durationDays"
            type="number"
            min={1}
            className={fieldInputClass}
            {...register('durationDays', { valueAsNumber: true })}
          />
        </FormField>

        {isVisitBased ? (
          <FormField
            id="visitCount"
            label={t('Visits included')}
            error={errors.visitCount?.message}
          >
            <input
              id="visitCount"
              type="number"
              min={1}
              className={fieldInputClass}
              {...register('visitCount', { valueAsNumber: true })}
            />
          </FormField>
        ) : null}

        <FormField
          id="price"
          label={t('Price ({{currency}})', { currency: getCurrency() })}
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
      </form>
    </Drawer>
  );
};
