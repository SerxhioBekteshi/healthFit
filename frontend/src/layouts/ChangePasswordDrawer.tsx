import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { authClient } from '@/services/auth';
import { t } from '@/i18n';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@gym/shared/validation/change-password';

interface ChangePasswordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export const ChangePasswordDrawer: React.FC<ChangePasswordDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [feedback, setFeedback] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset(defaultValues);
      setFeedback(null);
    }
  }, [form, isOpen]);

  const mutation = useMutation({
    meta: { success: 'Password updated.' },
    mutationFn: async (values: ChangePasswordFormValues) => {
      const result = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        throw new Error(
          result.error.message ?? t('Failed to update password.')
        );
      }
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: t('Password updated.') });
      form.reset(defaultValues);
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : t('Failed to update password.'),
      });
    },
  });

  const { errors } = form.formState;
  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Drawer
      isOpen={isOpen}
      title={t('Change password')}
      description={t('Update the password used to sign in to your account.')}
      onClose={onClose}
      onSubmitClick={onSubmit}
      submitLabel={t('Update password')}
      isPending={mutation.isPending}
    >
      <form className="grid gap-5" onSubmit={onSubmit}>
        <FormField
          id="header-current-password"
          label={t('Current password')}
          error={errors.currentPassword?.message}
        >
          <input
            id="header-current-password"
            type="password"
            autoComplete="current-password"
            className={fieldInputClass}
            {...form.register('currentPassword')}
          />
        </FormField>

        <FormField
          id="header-new-password"
          label={t('New password')}
          error={errors.newPassword?.message}
        >
          <input
            id="header-new-password"
            type="password"
            autoComplete="new-password"
            className={fieldInputClass}
            {...form.register('newPassword')}
          />
        </FormField>

        <FormField
          id="header-confirm-password"
          label={t('Confirm new password')}
          error={errors.confirmPassword?.message}
        >
          <input
            id="header-confirm-password"
            type="password"
            autoComplete="new-password"
            className={fieldInputClass}
            {...form.register('confirmPassword')}
          />
        </FormField>

        {feedback ? (
          <Alert tone={feedback.type === 'success' ? 'success' : 'error'}>
            {feedback.message}
          </Alert>
        ) : null}
      </form>
    </Drawer>
  );
};
