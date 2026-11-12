import React from 'react';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ApiClientError } from '@/services/api';
import { msg, t } from '@/i18n';
import { toast } from '@/utils/toast';

declare module '@tanstack/react-query' {
  interface Register {
    // `success` is the toast text; every mutation should set it. `silent` skips both toasts.
    mutationMeta: { success?: string; silent?: boolean };
    queryMeta: { silent?: boolean };
  }
}

const messageOf = (error: unknown): string =>
  error instanceof Error && error.message
    ? error.message
    : t('Something went wrong. Please try again.');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) return;
      // Cached data keeps the screen usable, and a 401 already sends the user to the login page.
      if (query.state.data !== undefined) return;
      if (error instanceof ApiClientError && error.status === 401) return;
      toast.error(messageOf(error));
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return;
      toast.success(t(mutation.meta?.success ?? msg('Done.')));
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return;
      toast.error(messageOf(error));
    },
  }),
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
