import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { ToastHost } from '@/components/ui/ToastHost';
import { queryClient } from './query-client';
import { SessionProvider } from './SessionProvider';

// React Query refetches stale data when the app comes back to the front, like a browser tab does.
const useRefetchOnForeground = (): void => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useRefetchOnForeground();
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {children}
          <ToastHost />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};
