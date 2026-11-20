import { apiClient } from '@/api/client';
import type { CommunityGyms, CommunityJoinResult } from '@gym/shared/types';

// For a member who signed up without a gym; the server derives who they are from the session.
export const communityService = {
  // `country` is a code or `all`; without it the server suggests the gyms of the member's own country.
  gyms: (country?: string) =>
    apiClient.get<CommunityGyms>('/community/gyms', { country }),
  join: (gymId: string) =>
    apiClient.post<CommunityJoinResult>('/community/join', { gymId }),
};
