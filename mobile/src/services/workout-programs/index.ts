import { apiClient } from '@/api/client';
import type { WorkoutProgram } from '@gym/shared/types';

export const workoutProgramsService = {
  list: () => apiClient.get<WorkoutProgram[]>('/workout-programs'),
};
