import { apiClient } from '@/services/api';
import type { WorkoutProgram } from '@gym/shared/types';
import type { WorkoutProgramInput } from '@gym/shared/validation/workout-programs';

export const workoutProgramsService = {
  list: () => apiClient.get<WorkoutProgram[]>('/workout-programs'),
  create: (input: WorkoutProgramInput) =>
    apiClient.post<WorkoutProgram>('/workout-programs', input),
  update: (id: string, input: WorkoutProgramInput) =>
    apiClient.patch<WorkoutProgram>(`/workout-programs/${id}`, input),
  remove: (id: string) =>
    apiClient.delete<{ id: string }>(`/workout-programs/${id}`),
};
