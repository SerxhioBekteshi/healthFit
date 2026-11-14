import { apiClient } from '@/services/api';
import type { SignupRequest } from '@gym/shared/types';
import type {
  RejectSignupRequestValues,
  SignupRequestValues,
} from '@gym/shared/validation/signup-requests';

export const signupRequestsService = {
  // Public: sent from the sign-up page by a gym owner who has no account yet.
  submit: (input: SignupRequestValues) =>
    apiClient.post<{ received: true }>('/signup-requests', input),
  list: () => apiClient.get<SignupRequest[]>('/signup-requests'),
  approve: (id: string) =>
    apiClient.post<SignupRequest>(`/signup-requests/${id}/approve`),
  reject: (id: string, input: RejectSignupRequestValues) =>
    apiClient.post<SignupRequest>(`/signup-requests/${id}/reject`, input),
};
