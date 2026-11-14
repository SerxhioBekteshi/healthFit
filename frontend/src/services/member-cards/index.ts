import { apiClient } from '@/services/api';
import type { MemberCard } from '@gym/shared/types';
import type { IssueCardValues } from '@gym/shared/validation/member-cards';

export const memberCardsService = {
  list: () => apiClient.get<MemberCard[]>('/member-cards'),
  issue: (input: IssueCardValues) =>
    apiClient.post<MemberCard>('/member-cards', input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<MemberCard>(`/member-cards/${id}/status`, { isActive }),
};
