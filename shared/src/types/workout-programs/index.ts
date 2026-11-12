export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  icon: string;
  // Uploaded photo path; empty when the default figure for `icon` is used.
  imageUrl: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  notes: string;
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutProgram {
  id: string;
  gymId: string;
  name: string;
  level: WorkoutLevel;
  description: string;
  // Uploaded cover photo path; empty when the default cover is used.
  imageUrl: string;
  sessionsPerWeek: number;
  days: WorkoutDay[];
  createdAt: string;
  updatedAt: string;
}
