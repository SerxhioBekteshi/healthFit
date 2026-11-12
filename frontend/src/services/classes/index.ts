import { apiClient } from '@/services/api';
import type { GymClass } from '@gym/shared/types';
import type { ClassFormValues } from '@gym/shared/validation/classes';

export const classesService = {
  list: () => apiClient.get<GymClass[]>('/classes'),
  create: (input: ClassFormValues) =>
    apiClient.post<GymClass>('/classes', input),
  update: (id: string, input: ClassFormValues) =>
    apiClient.patch<GymClass>(`/classes/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<GymClass>(`/classes/${id}/status`, { isActive }),
  remove: (id: string) => apiClient.delete<{ id: string }>(`/classes/${id}`),
};
