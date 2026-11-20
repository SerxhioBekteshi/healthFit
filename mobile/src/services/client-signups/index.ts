import { apiClient } from '@/api/client';
import type {
  ClientSignupLookup,
  ClientSignupResult,
  GymJoinPreview,
} from '@gym/shared/types';
import type {
  ClientClaimValues,
  ClientSignupValues,
} from '@gym/shared/validation/client-signups';

// Public calls: nobody is signed in while a member creates the account.
export const clientSignupsService = {
  lookup: (email: string) =>
    apiClient.post<ClientSignupLookup>('/client-signups/lookup', { email }),
  register: (input: ClientSignupValues) =>
    apiClient.post<ClientSignupResult>('/client-signups', input),
  claim: (input: ClientClaimValues) =>
    apiClient.post<ClientSignupResult>('/client-signups/claim', input),
  joinPreview: (joinCode: string) =>
    apiClient.get<GymJoinPreview>(
      `/client-signups/join/${encodeURIComponent(joinCode)}`
    ),
};
