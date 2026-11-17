import { apiClient } from '@/api/client';
import type { GymLocation } from '@gym/shared/types';

export const gymLocationsService = {
  // A client only gets the active locations.
  list: () => apiClient.get<GymLocation[]>('/gym-locations'),
};
