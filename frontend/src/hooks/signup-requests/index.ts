import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signupRequestsService } from '@/services/signup-requests';
import type {
  RejectSignupRequestValues,
  SignupRequestValues,
} from '@gym/shared/validation/signup-requests';

const requestsQueryKey = ['signup-requests'] as const;

// Super admin: the applications waiting for a decision and the ones already decided.
export const useSignupRequests = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: requestsQueryKey });

  const requestsQuery = useQuery({
    queryKey: requestsQueryKey,
    queryFn: signupRequestsService.list,
  });

  const approveRequest = useMutation({
    meta: { success: 'Request approved. The gym and its admin were created.' },
    mutationFn: (id: string) => signupRequestsService.approve(id),
    onSuccess: async () => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ['gyms'] }),
        queryClient.invalidateQueries({ queryKey: ['gym-admins'] }),
      ]);
    },
  });

  const rejectRequest = useMutation({
    meta: { success: 'Request rejected.' },
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: RejectSignupRequestValues;
    }) => signupRequestsService.reject(id, input),
    onSuccess: invalidate,
  });

  return {
    requests: requestsQuery.data ?? [],
    isLoading: requestsQuery.isLoading,
    error: requestsQuery.error,
    approveRequest,
    rejectRequest,
  };
};

// Public sign-up form; the page shows its own confirmation and errors.
export const useSubmitSignupRequest = () =>
  useMutation({
    meta: { silent: true },
    mutationFn: (input: SignupRequestValues) =>
      signupRequestsService.submit(input),
  });
