import { apiClient } from '@/services/api';
import type {
  ClientSignupLookup,
  ClientSignupResult,
  GymJoinCode,
  GymJoinPreview,
} from '@gym/shared/types';
import type {
  ClientClaimValues,
  ClientSignupValues,
} from '@gym/shared/validation/client-signups';

export const clientSignupsService = {
  // Public: the member sign-up form and the page a gym's join link opens.
  lookup: (email: string) =>
    apiClient.post<ClientSignupLookup>('/client-signups/lookup', { email }),
  register: (input: ClientSignupValues) =>
    apiClient.post<ClientSignupResult>('/client-signups', input),
  claim: (input: ClientClaimValues) =>
    apiClient.post<ClientSignupResult>('/client-signups/claim', input),
  joinPreview: (joinCode: string) =>
    apiClient.get<GymJoinPreview>(`/client-signups/join/${joinCode}`),
  // Gym admin: the gym's permanent join link.
  joinCode: () => apiClient.get<GymJoinCode>('/client-signups/join-code'),
  rotateJoinCode: () =>
    apiClient.post<GymJoinCode>('/client-signups/join-code/rotate'),
};
