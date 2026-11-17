import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { balanceService } from '@/services/balance';
import type { BalanceHistoryFilters } from '@gym/shared/types';
import { queryKeys } from '../query-keys';

const noFilters: BalanceHistoryFilters = {};

// The first page also carries the full balance (never the sum of the filtered rows); every page carries its transactions.
// The rows already on screen stay visible while new filters load.
export const useBalanceHistory = (filters: BalanceHistoryFilters = noFilters) =>
  useInfiniteQuery({
    queryKey: [...queryKeys.balance, 'history', filters],
    queryFn: ({ pageParam }) => balanceService.summary(pageParam, filters),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    select: (data) => ({
      balance: data.pages[0]?.balance ?? 0,
      transactions: data.pages.flatMap((page) => page.transactions),
    }),
  });
