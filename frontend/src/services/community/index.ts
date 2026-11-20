import { apiClient } from '@/services/api';
import type { CommunityGyms, CommunityJoinResult } from '@gym/shared/types';

export const communityService = {
  // Without a country the server suggests the gyms of the member's own country.
  gyms: (country?: string) =>
    apiClient.get<CommunityGyms>(
      country ? `/community/gyms?country=${country}` : '/community/gyms'
    ),
  join: (gymId: string) =>
    apiClient.post<CommunityJoinResult>('/community/join', { gymId }),
};
