import { apiClient } from '@/services/api';
import type { StaffMember } from '@gym/shared/types';
import type { StaffMemberFormValues } from '@gym/shared/validation/staff-members';

export const staffMembersService = {
  list: () => apiClient.get<StaffMember[]>('/staff-members'),
  create: (input: StaffMemberFormValues) =>
    apiClient.post<StaffMember>('/staff-members', input),
  update: (id: string, input: StaffMemberFormValues) =>
    apiClient.patch<StaffMember>(`/staff-members/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<StaffMember>(`/staff-members/${id}/status`, { isActive }),
};
