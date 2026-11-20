import { Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { msg, t } from '@/i18n';
import { useSession } from '@/providers/SessionProvider';
import { authService } from '@/services/auth';
import type { ChangePasswordFormValues } from '@gym/shared/validation/change-password';

export const useChangePassword = () =>
  useMutation({
    meta: { success: msg('Password updated.') },
    mutationFn: (values: ChangePasswordFormValues) =>
      authService.changePassword(values),
  });

// Asks first, then signs the member out of this phone.
export const useConfirmSignOut = (): (() => void) => {
  const { signOut } = useSession();
  return () =>
    Alert.alert(t('Sign out'), t('Do you want to sign out of this phone?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Sign out'),
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
};
