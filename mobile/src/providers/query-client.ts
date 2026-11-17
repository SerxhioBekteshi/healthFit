import { MutationCache, QueryClient } from '@tanstack/react-query';
import { isClientError } from '@/api/errors';
import { t } from '@/i18n';
import { toast } from '@/utils/toast';

// An English text (marked with `msg`) that is translated when shown, or a function that builds the translated text.
type SuccessMessage = string | ((data: unknown) => string);

declare module '@tanstack/react-query' {
  interface Register {
    // Every `useMutation` sets `meta: { success }`; the result shows as a toast.
    // Use a function when the message depends on what the server answered.
    mutationMeta: { success?: SuccessMessage };
  }
}

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (data, _variables, _onMutateResult, mutation) => {
      const message = mutation.meta?.success;
      if (message) {
        toast.success(
          typeof message === 'function' ? message(data) : t(message)
        );
      }
    },
    // Errors always show; screens that also want the message inline read `mutation.error`.
    onError: (error) => toast.error(error.message),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx answer will not change by asking again; a lost connection might.
      retry: (failureCount, error) =>
        !isClientError(error) && failureCount < MAX_RETRIES,
    },
  },
});
