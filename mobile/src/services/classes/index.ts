import { apiClient } from '@/api/client';
import type { GymClass } from '@gym/shared/types';

export const classesService = {
  // Only the active classes of the gym.
  list: () => apiClient.get<GymClass[]>('/classes'),
};
