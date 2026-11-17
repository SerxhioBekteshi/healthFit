import { useMutation, useQueryClient } from '@tanstack/react-query';
import { msg } from '@/i18n';
import { lockersService } from '@/services/lockers';
import { queryKeys } from '../query-keys';

// Saving or freeing a locker changes what the dashboard shows.
export const useLockerActions = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });

  const assignLocker = useMutation({
    meta: { success: msg('Locker saved.') },
    mutationFn: (lockerNumber: string) =>
      lockersService.assign({ lockerNumber }),
    onSuccess: refresh,
  });

  const releaseLocker = useMutation({
    meta: { success: msg('Locker freed.') },
    mutationFn: () => lockersService.release(),
    onSuccess: refresh,
  });

  return { assignLocker, releaseLocker };
};
