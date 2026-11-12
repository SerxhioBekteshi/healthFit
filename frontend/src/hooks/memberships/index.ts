import { useCallback } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { membershipsService } from '@/services/memberships';
import type { MembershipHistoryFilters } from '@gym/shared/types';
import type {
  CreateMembershipValues,
  RenewMembershipValues,
  SubscribeMembershipValues,
} from '@gym/shared/validation/memberships';

const membershipsQueryKey = ['memberships'] as const;
const noFilters: MembershipHistoryFilters = {};

// Latest memberships first, older pages load on demand.
export const useMembershipHistory = (
  filters: MembershipHistoryFilters = noFilters
) => {
  const query = useInfiniteQuery({
    queryKey: [...membershipsQueryKey, 'history', filters],
    queryFn: ({ pageParam }) => membershipsService.history(pageParam, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: (previous) => previous,
  });
  const { fetchNextPage } = query;
  const onLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return {
    memberships: query.data?.pages.flatMap((page) => page.memberships) ?? [],
    isLoading: query.isLoading,
    isFiltering: query.isPlaceholderData,
    pagination: {
      hasMore: query.hasNextPage,
      isLoadingMore: query.isFetchingNextPage,
      loadMoreFailed: query.isFetchNextPageError,
      onLoadMore,
    },
  };
};

export const useMemberships = () => {
  const queryClient = useQueryClient();
  // Payments also change the client's ledger.
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: membershipsQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['balance'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const membershipsQuery = useQuery({
    queryKey: membershipsQueryKey,
    queryFn: membershipsService.list,
  });

  const createMembership = useMutation({
    meta: { success: 'Membership saved.' },
    mutationFn: (input: CreateMembershipValues) =>
      membershipsService.create(input),
    onSuccess: invalidate,
  });

  const subscribeMembership = useMutation({
    meta: { success: 'Membership subscribed.' },
    mutationFn: (input: SubscribeMembershipValues) =>
      membershipsService.subscribe(input),
    onSuccess: invalidate,
  });

  const renewMembership = useMutation({
    meta: { success: 'Membership renewed.' },
    mutationFn: ({
      membershipId,
      input,
    }: {
      membershipId: string;
      input: RenewMembershipValues;
    }) => membershipsService.renew(membershipId, input),
    onSuccess: invalidate,
  });

  const cancelMembership = useMutation({
    meta: { success: 'Membership cancelled.' },
    mutationFn: (membershipId: string) =>
      membershipsService.cancel(membershipId),
    onSuccess: invalidate,
  });

  const confirmPayment = useMutation({
    meta: { success: 'Payment confirmed.' },
    mutationFn: (membershipId: string) =>
      membershipsService.confirmPayment(membershipId),
    onSuccess: invalidate,
  });

  return {
    memberships: membershipsQuery.data ?? [],
    isLoading: membershipsQuery.isLoading,
    error: membershipsQuery.error,
    createMembership,
    subscribeMembership,
    renewMembership,
    cancelMembership,
    confirmPayment,
  };
};
