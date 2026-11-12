import { apiClient } from '@/services/api';
import type { MembershipPlan } from '@gym/shared/types';
import type {
  MembershipPlanFormValues,
  PriceGridValues,
} from '@gym/shared/validation/membership-plans';

export const membershipPlansService = {
  list: () => apiClient.get<MembershipPlan[]>('/membership-plans'),
  savePriceGrid: (input: PriceGridValues) =>
    apiClient.put<MembershipPlan[]>('/membership-plans/price-grid', input),
  create: (input: MembershipPlanFormValues) =>
    apiClient.post<MembershipPlan>('/membership-plans', input),
  update: (id: string, input: MembershipPlanFormValues) =>
    apiClient.patch<MembershipPlan>(`/membership-plans/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<MembershipPlan>(`/membership-plans/${id}/status`, {
      isActive,
    }),
};
