import { apiClient } from '@/api/client';
import type { MembershipPlan } from '@gym/shared/types';

export const membershipPlansService = {
  // A client only gets the active plans of their own gender.
  list: () => apiClient.get<MembershipPlan[]>('/membership-plans'),
};
