import { apiClient } from '@/services/api';
import type { Locker, LockerAssignment } from '@gym/shared/types';
import type {
  AssignLockerValues,
  LockerRangeValues,
  ReleaseLockerValues,
} from '@gym/shared/validation/lockers';

export const lockersService = {
  list: (locationId?: string) =>
    apiClient.get<Locker[]>(
      locationId
        ? `/lockers?locationId=${encodeURIComponent(locationId)}`
        : '/lockers'
    ),
  createRange: (input: LockerRangeValues) =>
    apiClient.post<Locker[]>('/lockers', input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<Locker>(`/lockers/${id}/status`, { isActive }),
  remove: (id: string) => apiClient.delete<{ id: string }>(`/lockers/${id}`),
  assign: (input: AssignLockerValues) =>
    apiClient.post<LockerAssignment>('/lockers/assign', input),
  release: (input: ReleaseLockerValues) =>
    apiClient.post<{ released: boolean }>('/lockers/release', input),
};
