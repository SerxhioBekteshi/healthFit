import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '@/api/client';
import { ApiError, isNetworkError } from '@/api/errors';
import { applyCountryLanguage, loadLanguage, t } from '@/i18n';
import { authService } from '@/services/auth';
import { memberPassStore } from '@/storage/member-pass';
import { tokenStore } from '@/storage/token';
import { loadThemePreference } from '@/theme/preference';
import { toast } from '@/utils/toast';
import type { User } from '@gym/shared/types';
import type { LoginFormValues } from '@gym/shared/validation/auth';

// `loading`: reading the saved session. `unreachable`: a session is saved but the server did not answer.
type SessionStatus = 'loading' | 'signedOut' | 'signedIn' | 'unreachable';

interface SessionState {
  status: SessionStatus;
  user: User | null;
}

interface SessionContextValue extends SessionState {
  signIn: (values: LoginFormValues) => Promise<void>;
  signOut: () => Promise<void>;
  // Reads `/me` again, for example after a community member joined a gym.
  refreshUser: () => Promise<void>;
  retry: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// The session saved on the phone, checked with the server. `rejected` means it must be forgotten.
// The member's saved language and theme load first, so the first screen already uses them.
const readSavedSession = async (): Promise<SessionState | 'rejected'> => {
  await Promise.all([loadLanguage(), loadThemePreference()]);
  const token = await tokenStore.load();
  if (!token) return { status: 'signedOut', user: null };
  try {
    const user = await authService.me();
    return user.role === 'client' ? { status: 'signedIn', user } : 'rejected';
  } catch (error) {
    return isNetworkError(error)
      ? { status: 'unreachable', user: null }
      : 'rejected';
  }
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({
    status: 'loading',
    user: null,
  });
  const statusRef = useRef<SessionStatus>('loading');
  // Bumped by "Try again" to read the saved session once more.
  const [attempt, setAttempt] = useState(0);

  const update = useCallback((next: SessionState): void => {
    statusRef.current = next.status;
    // The gym's country sets the starting language; an explicit choice wins.
    if (next.user?.gymCountry) applyCountryLanguage(next.user.gymCountry);
    setState(next);
  }, []);

  // Forgets everything about the member: token, saved pass and cached answers.
  const clearSession = useCallback(async (): Promise<void> => {
    await Promise.all([tokenStore.clear(), memberPassStore.clear()]);
    queryClient.clear();
    update({ status: 'signedOut', user: null });
  }, [queryClient, update]);

  // Reads the saved session when the app opens, and again each time "Try again" is pressed.
  useEffect(() => {
    let active = true;
    void readSavedSession().then(async (saved) => {
      if (!active) return;
      if (saved === 'rejected') await clearSession();
      else update(saved);
    });
    return () => {
      active = false;
    };
  }, [attempt, clearSession, update]);

  // Any call answered with 401 while signed in means the session ended.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (statusRef.current !== 'signedIn') return;
      toast.info(t('Your session has expired. Please sign in again.'));
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const signIn = useCallback(
    async (values: LoginFormValues): Promise<void> => {
      const token = await authService.signIn(values);
      await tokenStore.set(token);
      try {
        const user = await authService.me();
        // Staff accounts can sign in on the API, but this app is only for members.
        if (user.role !== 'client') {
          throw new ApiError(
            t(
              'This app is for gym members. Gym owners and staff sign in on the web app.'
            ),
            403
          );
        }
        update({ status: 'signedIn', user });
      } catch (error) {
        await authService.signOut().catch(() => undefined);
        await tokenStore.clear();
        throw error;
      }
    },
    [update]
  );

  const signOut = useCallback(async (): Promise<void> => {
    await authService.signOut().catch(() => undefined);
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async (): Promise<void> => {
    const user = await authService.me();
    if (user.role === 'client') update({ status: 'signedIn', user });
  }, [update]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      refreshUser,
      retry: () => {
        update({ status: 'loading', user: null });
        setAttempt((count) => count + 1);
      },
    }),
    [state, signIn, signOut, refreshUser, update]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const value = useContext(SessionContext);
  if (!value)
    throw new Error('useSession must be used inside SessionProvider.');
  return value;
};
