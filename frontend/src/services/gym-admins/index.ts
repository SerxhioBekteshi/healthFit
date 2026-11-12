import { apiClient } from '@/services/api';
import type { GymAdmin } from '@gym/shared/types';
import type {
  CreateGymAdminValues,
  UpdateGymAdminValues,
} from '@gym/shared/validation/gym-admins';

export const gymAdminsService = {
  list: () => apiClient.get<GymAdmin[]>('/gym-admins'),
  create: (input: CreateGymAdminValues) =>
    apiClient.post<GymAdmin>('/gym-admins', input),
  update: (id: string, input: UpdateGymAdminValues) =>
    apiClient.patch<GymAdmin>(`/gym-admins/${id}`, input),
  remove: (id: string) => apiClient.delete<{ id: string }>(`/gym-admins/${id}`),
};
