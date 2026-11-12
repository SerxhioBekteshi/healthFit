import { useCallback } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';

const emptyStats = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  currentlyInside: 0,
};

// Newest check-ins first, older pages load on demand.
export const useAttendanceHistory = () => {
  const query = useInfiniteQuery({
    queryKey: ['attendance', 'history'],
    queryFn: ({ pageParam }) => attendanceService.history(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const { fetchNextPage } = query;
  const onLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return {
    records: query.data?.pages.flatMap((page) => page.records) ?? [],
    isLoading: query.isLoading,
    error: query.error,
    pagination: {
      hasMore: query.hasNextPage,
      isLoadingMore: query.isFetchingNextPage,
      loadMoreFailed: query.isFetchNextPageError,
      onLoadMore,
    },
  };
};

export const useAttendance = (limit?: number) => {
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['attendance', 'records', limit ?? 'all'],
    queryFn: () => attendanceService.list(limit),
  });

  const statsQuery = useQuery({
    queryKey: ['attendance', 'stats'],
    queryFn: attendanceService.stats,
    // Occupancy changes without any action from this screen.
    refetchInterval: 60_000,
  });

  const checkIn = useMutation({
    meta: { success: 'Check-in recorded.' },
    mutationFn: ({
      clientId,
      locationId,
    }: {
      clientId: string;
      locationId?: string;
    }) => attendanceService.checkIn(clientId, locationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['attendance'] }),
        // Visit packs lose a visit on check-in.
        queryClient.invalidateQueries({ queryKey: ['memberships'] }),
      ]);
    },
  });

  return {
    records: recordsQuery.data ?? [],
    stats: statsQuery.data ?? emptyStats,
    isLoading: recordsQuery.isLoading || statsQuery.isLoading,
    error: recordsQuery.error ?? statsQuery.error,
    checkIn,
  };
};
