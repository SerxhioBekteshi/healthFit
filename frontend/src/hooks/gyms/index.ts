import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymsService } from '@/services/gyms';
import type { GymFormValues } from '@gym/shared/validation/gyms';

const gymsQueryKey = ['gyms'] as const;

export const useGyms = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: gymsQueryKey });

  const gymsQuery = useQuery({
    queryKey: gymsQueryKey,
    queryFn: gymsService.list,
  });

  const createGym = useMutation({
    meta: { success: 'Gym created.' },
    mutationFn: (input: GymFormValues) => gymsService.create(input),
    onSuccess: invalidate,
  });

  const updateGym = useMutation({
    meta: { success: 'Gym updated.' },
    mutationFn: ({ gymId, input }: { gymId: string; input: GymFormValues }) =>
      gymsService.update(gymId, input),
    onSuccess: invalidate,
  });

  const setGymActive = useMutation({
    meta: { success: 'Gym status updated.' },
    mutationFn: ({ gymId, isActive }: { gymId: string; isActive: boolean }) =>
      gymsService.setActive(gymId, isActive),
    onSuccess: invalidate,
  });

  return {
    gyms: gymsQuery.data ?? [],
    isLoading: gymsQuery.isLoading,
    error: gymsQuery.error,
    createGym,
    updateGym,
    setGymActive,
  };
};
