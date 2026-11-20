import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { applyGymCountryLanguage, fetchSession } from '@/hooks/session';
import { clientSignupsService } from '@/services/client-signups';
import { authClient } from '@/services/auth';
import { t } from '@/i18n';
import type { User } from '@gym/shared/types';
import type {
  ClientClaimValues,
  ClientSignupValues,
} from '@gym/shared/validation/client-signups';

const joinCodeQueryKey = ['gym-join-code'] as const;

// A new account signs in at once, so the member lands in the app without a second form.
const signInAndLoad = async (
  queryClient: QueryClient,
  email: string,
  password: string
): Promise<User> => {
  const result = await authClient.signIn.email({ email, password });
  if (result.error) {
    throw new Error(t('Invalid email or password.'));
  }
  queryClient.removeQueries({ queryKey: ['me'] });
  return queryClient.fetchQuery({ queryKey: ['me'], queryFn: fetchSession });
};

// Public: the join page loads before anyone signs in; the gym's country sets its language.
export const useGymJoinPreview = (joinCode: string | undefined) =>
  useQuery({
    queryKey: ['gym-join', joinCode],
    enabled: Boolean(joinCode),
    queryFn: async () => {
      const preview = await clientSignupsService.joinPreview(joinCode ?? '');
      applyGymCountryLanguage(preview.gymCountry);
      return preview;
    },
    retry: false,
    meta: { silent: true },
  });

export const useClientSignupLookup = () =>
  useMutation({
    meta: { silent: true },
    mutationFn: (email: string) => clientSignupsService.lookup(email),
  });

export const useClientSignup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { success: 'Your account is ready.' },
    mutationFn: async (input: ClientSignupValues) => {
      await clientSignupsService.register(input);
      return signInAndLoad(queryClient, input.email, input.password);
    },
  });
};

export const useClaimClientAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { success: 'Password set. You are signed in.' },
    mutationFn: async (input: ClientClaimValues) => {
      await clientSignupsService.claim(input);
      return signInAndLoad(queryClient, input.email, input.password);
    },
  });
};

// Gym admin: the permanent link and QR for new members.
export const useGymJoinCode = (enabled = true) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: joinCodeQueryKey,
    queryFn: clientSignupsService.joinCode,
    enabled,
  });
  const rotate = useMutation({
    meta: { success: 'New join link created. The old one no longer works.' },
    mutationFn: clientSignupsService.rotateJoinCode,
    onSuccess: (data) => queryClient.setQueryData(joinCodeQueryKey, data),
  });
  return {
    joinCode: query.data?.joinCode ?? null,
    isLoading: query.isLoading,
    error: query.error,
    rotate,
  };
};
