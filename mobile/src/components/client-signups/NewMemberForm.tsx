import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { ChoiceField } from '@/components/ui/ChoiceField';
import { FormTextField } from '@/components/ui/FormTextField';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { countryCodes, countryNames } from '@/utils/countries';
import { genderLabels, genders } from '@/utils/labels';
import {
  clientSignupFormSchema,
  type ClientSignupFormValues,
} from '@gym/shared/validation/client-signups';

interface NewMemberFormProps {
  // The gym's country when the member came with a gym's code or link; otherwise they choose it.
  defaultCountry?: ClientSignupFormValues['country'];
  // Kept when the member comes back to this form from a later step.
  defaultValues: ClientSignupFormValues | null;
  isPending: boolean;
  submitDisabled: boolean;
  serverError: string | null;
  onSubmit: (values: ClientSignupFormValues) => void;
  // Shown above the button, for the optional gym join code.
  children?: React.ReactNode;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({ form: { gap: theme.spacing.lg } });

const emptyValues: Partial<ClientSignupFormValues> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: undefined,
  country: undefined,
  password: '',
  confirmPassword: '',
};

// The same details a gym asks for when it adds a client, plus the password they choose themselves.
export const NewMemberForm: React.FC<NewMemberFormProps> = ({
  defaultCountry,
  defaultValues,
  isPending,
  submitDisabled,
  serverError,
  onSubmit,
  children,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { control, handleSubmit, getValues, setValue } =
    useForm<ClientSignupFormValues>({
      resolver: zodResolver(clientSignupFormSchema),
      defaultValues: defaultValues ?? {
        ...emptyValues,
        country: defaultCountry,
      },
    });

  // The gym's country arrives once its code has been checked; a country the member chose stays.
  useEffect(() => {
    if (defaultCountry && !getValues('country')) {
      setValue('country', defaultCountry);
    }
  }, [defaultCountry, getValues, setValue]);

  const submit = handleSubmit(onSubmit);

  return (
    <View style={styles.form}>
      {serverError ? <Banner tone="danger" message={serverError} /> : null}
      <FormTextField
        control={control}
        name="firstName"
        label={t('First name')}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
      />
      <FormTextField
        control={control}
        name="lastName"
        label={t('Surname')}
        autoCapitalize="words"
        autoComplete="family-name"
        textContentType="familyName"
      />
      <FormTextField
        control={control}
        name="email"
        label={t('Email')}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="phone"
        label={t('Phone')}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <Controller
        control={control}
        name="gender"
        render={({ field, fieldState }) => (
          <ChoiceField
            label={t('Gender')}
            options={genders.map((value) => ({
              value,
              label: genderLabels[value],
            }))}
            value={field.value ?? null}
            onChange={field.onChange}
            error={
              fieldState.error?.message
                ? t(fieldState.error.message)
                : undefined
            }
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field, fieldState }) => (
          <ChoiceField
            label={t('Country')}
            options={countryCodes.map((value) => ({
              value,
              label: countryNames[value],
            }))}
            value={field.value ?? null}
            onChange={field.onChange}
            error={
              fieldState.error?.message
                ? t(fieldState.error.message)
                : undefined
            }
          />
        )}
      />
      <FormTextField
        control={control}
        name="password"
        label={t('Password')}
        hint={t(
          'At least 8 characters, with a number and an uppercase letter.'
        )}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('Confirm new password')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {children}
      <Button
        label={t('Create account')}
        onPress={() => void submit()}
        loading={isPending}
        disabled={submitDisabled}
        fullWidth
      />
    </View>
  );
};
