import { apiClient } from '@/api/client';
import type { LockerAssignment } from '@gym/shared/types';
import type {
  AssignLockerValues,
  ReleaseLockerValues,
} from '@gym/shared/validation/lockers';

export const lockersService = {
  // A member sends no `code`: the server uses their own open visit.
  assign: (values: AssignLockerValues) =>
    apiClient.post<LockerAssignment>('/lockers/assign', values),
  release: (values: ReleaseLockerValues = {}) =>
    apiClient.post<unknown>('/lockers/release', values),
};
