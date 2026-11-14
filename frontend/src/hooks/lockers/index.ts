import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lockersService } from '@/services/lockers';
import type {
  AssignLockerValues,
  LockerRangeValues,
  ReleaseLockerValues,
} from '@gym/shared/validation/lockers';

const lockersQueryKey = ['lockers'] as const;

// A locker follows the member's visit, so what a member sees on their dashboard refreshes too.
const refreshKeys = [lockersQueryKey, ['dashboard'], ['attendance']] as const;

const useRefreshLockers = () => {
  const queryClient = useQueryClient();
  return async (): Promise<void> => {
    await Promise.all(
      refreshKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
    );
  };
};

// Taking and freeing a locker: staff at the desk, or a member for themselves.
export const useLockerActions = () => {
  const refresh = useRefreshLockers();

  const assignLocker = useMutation({
    meta: { success: 'Locker saved.' },
    mutationFn: (input: AssignLockerValues) => lockersService.assign(input),
    onSuccess: refresh,
  });

  const releaseLocker = useMutation({
    meta: { success: 'Locker freed.' },
    mutationFn: (input: ReleaseLockerValues) => lockersService.release(input),
    onSuccess: refresh,
  });

  return { assignLocker, releaseLocker };
};

// The gym owner's list of lockers.
export const useLockers = (locationId?: string) => {
  const refresh = useRefreshLockers();

  const lockersQuery = useQuery({
    queryKey: [...lockersQueryKey, locationId ?? 'all'],
    queryFn: () => lockersService.list(locationId),
  });

  const addLockers = useMutation({
    meta: { success: 'Lockers added.' },
    mutationFn: (input: LockerRangeValues) => lockersService.createRange(input),
    onSuccess: refresh,
  });

  const setLockerActive = useMutation({
    meta: { success: 'Locker updated.' },
    mutationFn: ({
      lockerId,
      isActive,
    }: {
      lockerId: string;
      isActive: boolean;
    }) => lockersService.setActive(lockerId, isActive),
    onSuccess: refresh,
  });

  const deleteLocker = useMutation({
    meta: { success: 'Locker removed.' },
    mutationFn: (lockerId: string) => lockersService.remove(lockerId),
    onSuccess: refresh,
  });

  return {
    lockers: lockersQuery.data ?? [],
    isLoading: lockersQuery.isLoading,
    error: lockersQuery.error,
    addLockers,
    setLockerActive,
    deleteLocker,
  };
};
