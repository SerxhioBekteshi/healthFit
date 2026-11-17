import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { msg } from '@/i18n';
import { attendanceService } from '@/services/attendance';
import { invalidateMemberData, queryKeys } from '../query-keys';

// The days of one month (YYYY-MM) on which the member checked in; loads only while the history is open.
export const useAttendanceDays = (month: string, enabled: boolean) =>
  useQuery({
    queryKey: [...queryKeys.attendance, 'days', month],
    queryFn: () => attendanceService.days(month),
    enabled,
  });

// Cursor-paged: `nextCursor` is null on the last page.
export const useAttendanceHistory = () =>
  useInfiniteQuery({
    queryKey: [...queryKeys.attendance, 'history'],
    queryFn: ({ pageParam }) => attendanceService.history(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.records),
  });

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { success: msg('You are checked out. See you next time!') },
    mutationFn: attendanceService.checkOut,
    onSuccess: () => invalidateMemberData(queryClient),
  });
};
