import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymClosuresService } from '@/services/gym-closures';
import type { GymClosureFormValues } from '@gym/shared/validation/gym-closures';

const closuresQueryKey = ['closures'] as const;

export const useGymClosures = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: closuresQueryKey });

  const closuresQuery = useQuery({
    queryKey: closuresQueryKey,
    queryFn: gymClosuresService.list,
  });

  const createClosure = useMutation({
    meta: { success: 'Closure added.' },
    mutationFn: (input: GymClosureFormValues) =>
      gymClosuresService.create(input),
    onSuccess: invalidate,
  });

  const updateClosure = useMutation({
    meta: { success: 'Closure updated.' },
    mutationFn: ({
      closureId,
      input,
    }: {
      closureId: string;
      input: GymClosureFormValues;
    }) => gymClosuresService.update(closureId, input),
    onSuccess: invalidate,
  });

  const deleteClosure = useMutation({
    meta: { success: 'Closure deleted.' },
    mutationFn: (closureId: string) => gymClosuresService.remove(closureId),
    onSuccess: invalidate,
  });

  return {
    closures: closuresQuery.data ?? [],
    isLoading: closuresQuery.isLoading,
    error: closuresQuery.error,
    createClosure,
    updateClosure,
    deleteClosure,
  };
};
