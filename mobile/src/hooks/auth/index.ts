import { useMutation } from '@tanstack/react-query';
import { msg } from '@/i18n';
import { authService } from '@/services/auth';
import type { ChangePasswordFormValues } from '@gym/shared/validation/change-password';

export const useChangePassword = () =>
  useMutation({
    meta: { success: msg('Password updated.') },
    mutationFn: (values: ChangePasswordFormValues) =>
      authService.changePassword(values),
  });
