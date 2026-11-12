import { useCallback } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { balanceService } from '@/services/balance';
import type { BalanceHistoryFilters } from '@gym/shared/types';
import type { DepositValues } from '@gym/shared/validation/balance';

const noFilters: BalanceHistoryFilters = {};

// Pass a clientId when a gym admin looks at a member; leave it out for the signed-in client.
export const useBalance = (
  clientId?: string,
  enabled = true,
  filters: BalanceHistoryFilters = noFilters
) => {
  const queryClient = useQueryClient();
  const owner = clientId ?? 'me';

  const summaryQuery = useInfiniteQuery({
    queryKey: ['balance', owner, filters],
    queryFn: ({ pageParam }) =>
      balanceService.summary(clientId, pageParam, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // Keeps the balance and rows on screen while new filters load, but never another member's.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === owner ? previous : undefined,
    enabled,
  });
  const { fetchNextPage } = summaryQuery;
  const onLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const deposit = useMutation({
    meta: { success: 'Funds added to the balance.' },
    mutationFn: (input: DepositValues) => balanceService.deposit(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['balance'] }),
  });

  const pages = summaryQuery.data?.pages ?? [];

  return {
    balance: pages[0]?.balance ?? 0,
    transactions: pages.flatMap((page) => page.transactions),
    isLoading: summaryQuery.isLoading,
    // True while the rows shown still belong to the previous filters.
    isFiltering: summaryQuery.isPlaceholderData,
    error: summaryQuery.error,
    // Spread into BalanceTransactionList to load older rows on scroll.
    pagination: {
      hasMore: summaryQuery.hasNextPage,
      isLoadingMore: summaryQuery.isFetchingNextPage,
      loadMoreFailed: summaryQuery.isFetchNextPageError,
      onLoadMore,
    },
    deposit,
  };
};
