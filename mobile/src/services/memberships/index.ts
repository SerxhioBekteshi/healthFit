import { apiClient } from '@/api/client';
import type { Membership } from '@gym/shared/types';
import type { SubscribeMembershipValues } from '@gym/shared/validation/memberships';

export const membershipsService = {
  list: () => apiClient.get<Membership[]>('/memberships'),
  subscribe: (values: SubscribeMembershipValues) =>
    apiClient.post<Membership>('/memberships/subscribe', values),
};
