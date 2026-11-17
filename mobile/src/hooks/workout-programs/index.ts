import { useQuery } from '@tanstack/react-query';
import { workoutProgramsService } from '@/services/workout-programs';
import { queryKeys } from '../query-keys';

export const useWorkoutPrograms = () =>
  useQuery({
    queryKey: queryKeys.workoutPrograms,
    queryFn: workoutProgramsService.list,
  });
