import { apiClient } from '@/services/api';
import type { Gym } from '@gym/shared/types';
import type { GymFormValues } from '@gym/shared/validation/gyms';

export const gymsService = {
  list: () => apiClient.get<Gym[]>('/gyms'),
  create: (input: GymFormValues) => apiClient.post<Gym>('/gyms', input),
  update: (id: string, input: GymFormValues) =>
    apiClient.patch<Gym>(`/gyms/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<Gym>(`/gyms/${id}/status`, { isActive }),
};
