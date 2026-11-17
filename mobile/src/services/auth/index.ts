import { request } from '@/api/client';
import { ApiError } from '@/api/errors';
import { t } from '@/i18n';
import { tokenStore } from '@/storage/token';
import type { User } from '@gym/shared/types';
import type { LoginFormValues } from '@gym/shared/validation/auth';
import type { ChangePasswordFormValues } from '@gym/shared/validation/change-password';

interface SignInBody {
  token?: string;
}

export const authService = {
  // Better Auth answers with the session token in the `set-auth-token` header.
  async signIn(values: LoginFormValues): Promise<string> {
    const { body, headers } = await request<SignInBody>({
      method: 'POST',
      path: '/api/auth/sign-in/email',
      body: values,
      ownsUnauthorized: true,
    });
    const token = headers.get('set-auth-token') ?? body?.token;
    if (!token) {
      throw new ApiError(t('Sign-in failed. Please try again.'), 500);
    }
    return token;
  },

  async signOut(): Promise<void> {
    await request<unknown>({
      method: 'POST',
      path: '/api/auth/sign-out',
      body: {},
      ownsUnauthorized: true,
    });
  },

  // Other devices are signed out. The server issues a new token for this phone, which must replace the old one.
  async changePassword(values: ChangePasswordFormValues): Promise<void> {
    const { body, headers } = await request<SignInBody>({
      method: 'POST',
      path: '/api/auth/change-password',
      body: {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      },
      ownsUnauthorized: true,
    });
    const token = headers.get('set-auth-token') ?? body?.token;
    if (token) await tokenStore.set(token);
  },

  async me(): Promise<User> {
    const { body } = await request<{ data: User }>({
      method: 'GET',
      path: '/api/v1/me',
    });
    return body.data;
  },
};
