import type { BadgeTone } from '@/components/ui/Badge';
import { msg, translated } from '@/i18n';
import type { WorkoutLevel } from '@gym/shared/types';

export const workoutLevels: WorkoutLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
];

export const workoutLevelLabels = translated<WorkoutLevel>({
  beginner: msg('Beginner'),
  intermediate: msg('Intermediate'),
  advanced: msg('Advanced'),
});

export const workoutLevelTone: Record<WorkoutLevel, BadgeTone> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};
