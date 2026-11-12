import { apiClient } from '@/services/api';
import type { GymClosure } from '@gym/shared/types';
import type { GymClosureFormValues } from '@gym/shared/validation/gym-closures';

export const gymClosuresService = {
  list: () => apiClient.get<GymClosure[]>('/closures'),
  create: (input: GymClosureFormValues) =>
    apiClient.post<GymClosure>('/closures', input),
  update: (id: string, input: GymClosureFormValues) =>
    apiClient.patch<GymClosure>(`/closures/${id}`, input),
  remove: (id: string) => apiClient.delete<{ id: string }>(`/closures/${id}`),
};
