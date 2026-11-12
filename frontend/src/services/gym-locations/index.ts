import { apiClient } from '@/services/api';
import type { GymLocation } from '@gym/shared/types';
import type { GymLocationFormValues } from '@gym/shared/validation/gym-locations';

export const gymLocationsService = {
  list: () => apiClient.get<GymLocation[]>('/gym-locations'),
  create: (input: GymLocationFormValues) =>
    apiClient.post<GymLocation>('/gym-locations', input),
  update: (id: string, input: GymLocationFormValues) =>
    apiClient.patch<GymLocation>(`/gym-locations/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<GymLocation>(`/gym-locations/${id}/status`, { isActive }),
};
