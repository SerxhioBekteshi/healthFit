import React from 'react';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { useTranslation } from '@/i18n';
import { TextField, type TextFieldProps } from './TextField';

interface FormTextFieldProps<TValues extends FieldValues> extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
}

// A TextField wired to React Hook Form: the value, the blur and the validation message come from the form.
// Messages of the shared Zod schemas are English texts, translated here.
export const FormTextField = <TValues extends FieldValues>({
  control,
  name,
  ...fieldProps
}: FormTextFieldProps<TValues>): React.ReactElement => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...fieldProps}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={
            fieldState.error?.message ? t(fieldState.error.message) : undefined
          }
        />
      )}
    />
  );
};
