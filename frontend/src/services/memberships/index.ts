import { apiClient } from '@/services/api';
import type {
  Membership,
  MembershipHistoryFilters,
  MembershipHistoryPage,
} from '@gym/shared/types';
import type {
  CreateMembershipValues,
  RenewMembershipValues,
  SubscribeMembershipValues,
} from '@gym/shared/validation/memberships';

export const membershipsService = {
  list: () => apiClient.get<Membership[]>('/memberships'),
  history: (cursor?: string, filters: MembershipHistoryFilters = {}) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (filters.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    const query = params.toString();
    return apiClient.get<MembershipHistoryPage>(
      query ? `/memberships/history?${query}` : '/memberships/history'
    );
  },
  create: (input: CreateMembershipValues) =>
    apiClient.post<Membership>('/memberships', input),
  subscribe: (input: SubscribeMembershipValues) =>
    apiClient.post<Membership>('/memberships/subscribe', input),
  renew: (id: string, input: RenewMembershipValues) =>
    apiClient.post<Membership>(`/memberships/${id}/renew`, input),
  cancel: (id: string) =>
    apiClient.post<Membership>(`/memberships/${id}/cancel`),
  confirmPayment: (id: string) =>
    apiClient.post<Membership>(`/memberships/${id}/confirm-payment`),
};
