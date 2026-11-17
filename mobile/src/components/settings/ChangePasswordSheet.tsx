import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FormTextField } from '@/components/ui/FormTextField';
import { useChangePassword } from '@/hooks/auth';
import { useTranslation } from '@/i18n';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@gym/shared/validation/change-password';

interface ChangePasswordSheetProps {
  visible: boolean;
  onClose: () => void;
}

const emptyValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

// The member sets a new password; their other devices are signed out.
export const ChangePasswordSheet: React.FC<ChangePasswordSheetProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const changePassword = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: emptyValues,
  });

  // Closing the sheet forgets what was typed.
  const close = (): void => {
    reset(emptyValues);
    setServerError(null);
    changePassword.reset();
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await changePassword.mutateAsync(values);
      close();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : t('Failed to update password.')
      );
    }
  });

  return (
    <BottomSheet
      visible={visible}
      title={t('Change password')}
      description={t(
        'Use at least 8 characters with a capital letter and a number.'
      )}
      onClose={close}
      submitLabel={t('Update password')}
      onSubmit={() => void submit()}
      isSubmitting={changePassword.isPending}
    >
      {serverError ? <Banner tone="danger" message={serverError} /> : null}
      <FormTextField
        control={control}
        name="currentPassword"
        label={t('Current password')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      <FormTextField
        control={control}
        name="newPassword"
        label={t('New password')}
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
        onSubmitEditing={() => void submit()}
      />
    </BottomSheet>
  );
};
