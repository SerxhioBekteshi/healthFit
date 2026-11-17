import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membershipsService } from '@/services/memberships';
import { subscriptionMessage } from '@/utils/memberships';
import type { Membership } from '@gym/shared/types';
import type { SubscribeMembershipValues } from '@gym/shared/validation/memberships';
import { invalidateMemberData, queryKeys } from '../query-keys';

export const useMemberships = () =>
  useQuery({
    queryKey: queryKeys.memberships,
    queryFn: membershipsService.list,
  });

// Subscribing with the member's balance. Card payments go through `usePaymentChallenge`.
export const useSubscribeMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { success: (data) => subscriptionMessage(data as Membership) },
    mutationFn: (values: SubscribeMembershipValues) =>
      membershipsService.subscribe(values),
    onSuccess: () => invalidateMemberData(queryClient),
  });
};
