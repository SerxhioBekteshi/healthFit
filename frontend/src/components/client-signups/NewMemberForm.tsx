import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { t } from '@/i18n';
import { countryNames } from '@/utils/constants/countries';
import { genderLabels, genders } from '@/utils/constants/labels';
import { COUNTRY_CODES } from '@gym/shared/validation/gyms';
import {
  clientSignupFormSchema,
  type ClientSignupFormValues,
} from '@gym/shared/validation/client-signups';

interface NewMemberFormProps {
  joinCode?: string;
  // The gym's country when the visitor came from a gym's link; otherwise they choose it.
  defaultCountry?: ClientSignupFormValues['country'];
  // Kept when the visitor comes back to this form from a later step.
  defaultValues?: ClientSignupFormValues | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: ClientSignupFormValues) => void;
}

// The same details a gym asks for when it adds a client, plus the password they choose themselves.
export const NewMemberForm: React.FC<NewMemberFormProps> = ({
  joinCode,
  defaultCountry,
  defaultValues,
  isPending,
  serverError,
  onSubmit,
}) => {
  const initial: DefaultValues<ClientSignupFormValues> = defaultValues ?? {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: undefined,
    country: defaultCountry,
    password: '',
    confirmPassword: '',
    joinCode,
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientSignupFormValues>({
    resolver: zodResolver(clientSignupFormSchema),
    defaultValues: initial,
  });

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="firstName"
          label={t('First name')}
          error={errors.firstName?.message}
        >
          <input
            id="firstName"
            autoComplete="given-name"
            className={fieldInputClass}
            {...register('firstName')}
          />
        </FormField>
        <FormField
          id="lastName"
          label={t('Surname')}
          error={errors.lastName?.message}
        >
          <input
            id="lastName"
            autoComplete="family-name"
            className={fieldInputClass}
            {...register('lastName')}
          />
        </FormField>
      </div>

      <FormField id="email" label={t('Email')} error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={fieldInputClass}
          {...register('email')}
        />
      </FormField>

      <FormField id="phone" label={t('Phone')} error={errors.phone?.message}>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          className={fieldInputClass}
          {...register('phone')}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="gender"
          label={t('Gender')}
          error={errors.gender?.message}
        >
          <select
            id="gender"
            className={fieldInputClass}
            {...register('gender')}
          >
            <option value="">{t('Select...')}</option>
            {genders.map((value) => (
              <option key={value} value={value}>
                {genderLabels[value]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="country"
          label={t('Country')}
          error={errors.country?.message}
        >
          <select
            id="country"
            autoComplete="country"
            className={fieldInputClass}
            {...register('country')}
          >
            <option value="">{t('Select...')}</option>
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {countryNames[code]}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        id="password"
        label={t('Password')}
        hint={t(
          'At least 8 characters, with a number and an uppercase letter.'
        )}
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
        id="confirmPassword"
        label={t('Confirm new password')}
        error={errors.confirmPassword?.message}
      >
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={fieldInputClass}
          {...register('confirmPassword')}
        />
      </FormField>

      {serverError ? <Alert>{serverError}</Alert> : null}

      <Button type="submit" className="w-full" loading={isPending}>
        {isPending ? t('Creating account') : t('Create account')}
      </Button>
    </form>
  );
};
