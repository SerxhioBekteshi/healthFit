import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { applyCountryLanguage } from '@/i18n';
import { useSession } from '@/providers/SessionProvider';
import { clientSignupsService } from '@/services/client-signups';
import { extractJoinCode } from '@/utils/client-signups';
import type {
  ClientClaimValues,
  ClientSignupValues,
} from '@gym/shared/validation/client-signups';
import { queryKeys } from '../query-keys';

const TYPING_PAUSE_MS = 500;

// The code or link as typed; the gym is looked up once the member stops typing.
export const useGymJoinPreview = (typed: string) => {
  const code = extractJoinCode(typed);
  const [settled, setSettled] = useState(code);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(code), TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [code]);

  const query = useQuery({
    queryKey: queryKeys.gymJoin(settled),
    enabled: settled !== '',
    queryFn: async () => {
      const preview = await clientSignupsService.joinPreview(settled);
      applyCountryLanguage(preview.gymCountry);
      return preview;
    },
    retry: false,
  });

  const confirmed = code === settled ? query.data : undefined;

  return {
    code,
    gymName: confirmed?.gymName ?? null,
    gymCountry: confirmed?.gymCountry,
    // A code that is typed but not (yet) confirmed by the server must not be sent.
    isChecking: code !== '' && (code !== settled || query.isPending),
    isInvalid: code !== '' && code === settled && query.isError,
  };
};

// The answer decides the next step of the form, so it has no success toast of its own.
export const useClientSignupLookup = () =>
  useMutation({
    mutationFn: (email: string) => clientSignupsService.lookup(email),
  });

// A new account signs in at once, so the member lands in the app without a second form.
export const useClientSignup = () => {
  const { signIn } = useSession();
  return useMutation({
    meta: { success: 'Your account is ready.' },
    mutationFn: async (input: ClientSignupValues) => {
      await clientSignupsService.register(input);
      await signIn({ email: input.email, password: input.password });
    },
  });
};

export const useClaimClientAccount = () => {
  const { signIn } = useSession();
  return useMutation({
    meta: { success: 'Password set. You are signed in.' },
    mutationFn: async (input: ClientClaimValues) => {
      await clientSignupsService.claim(input);
      await signIn({ email: input.email, password: input.password });
    },
  });
};
