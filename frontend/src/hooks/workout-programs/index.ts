import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workoutProgramsService } from '@/services/workout-programs';
import type { WorkoutProgramInput } from '@gym/shared/validation/workout-programs';

const programsQueryKey = ['workout-programs'] as const;

export const useWorkoutPrograms = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: programsQueryKey });

  const programsQuery = useQuery({
    queryKey: programsQueryKey,
    queryFn: workoutProgramsService.list,
  });

  const createProgram = useMutation({
    meta: { success: 'Program created.' },
    mutationFn: (input: WorkoutProgramInput) =>
      workoutProgramsService.create(input),
    onSuccess: invalidate,
  });

  const updateProgram = useMutation({
    meta: { success: 'Program updated.' },
    mutationFn: ({
      programId,
      input,
    }: {
      programId: string;
      input: WorkoutProgramInput;
    }) => workoutProgramsService.update(programId, input),
    onSuccess: invalidate,
  });

  const deleteProgram = useMutation({
    meta: { success: 'Program deleted.' },
    mutationFn: (programId: string) => workoutProgramsService.remove(programId),
    onSuccess: invalidate,
  });

  return {
    programs: programsQuery.data ?? [],
    isLoading: programsQuery.isLoading,
    error: programsQuery.error,
    createProgram,
    updateProgram,
    deleteProgram,
  };
};
