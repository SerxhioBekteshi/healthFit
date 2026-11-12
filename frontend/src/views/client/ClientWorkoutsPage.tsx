import React, { useMemo, useState } from 'react';
import { WorkoutProgramCard } from '@/components/workout-programs/WorkoutProgramCard';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWorkoutPrograms } from '@/hooks/workout-programs';
import { t } from '@/i18n';
import type { WorkoutLevel, WorkoutProgram } from '@gym/shared/types';
import {
  workoutLevelLabels,
  workoutLevels,
} from '@/utils/constants/workout-levels';

export const ClientWorkoutsPage: React.FC = () => {
  const { programs, isLoading, error } = useWorkoutPrograms();
  const [activeLevel, setActiveLevel] = useState<WorkoutLevel>('beginner');

  const programsByLevel = useMemo(() => {
    const groups: Record<WorkoutLevel, WorkoutProgram[]> = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };
    for (const program of programs) {
      groups[program.level].push(program);
    }
    return groups;
  }, [programs]);

  const visible = programsByLevel[activeLevel];

  return (
    <>
      <PageHeader
        eyebrow={t('Member area')}
        title={t('Your')}
        accent={t('workouts')}
        description={t('Weekly plans organized by difficulty level.')}
      />

      <div className="mb-6">
        <Segmented
          label={t('Program level')}
          value={activeLevel}
          onChange={setActiveLevel}
          options={workoutLevels.map((level) => ({
            value: level,
            label: workoutLevelLabels[level],
            count: programsByLevel[level].length,
          }))}
        />
      </div>

      {error ? <Alert>{error.message}</Alert> : null}
      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-4">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
              <p className="text-sm font-semibold text-bone">
                {t('No {{level}} programs published yet', {
                  level: workoutLevelLabels[activeLevel].toLowerCase(),
                })}
              </p>
            </div>
          ) : null}
          {visible.map((program) => (
            <WorkoutProgramCard key={program.id} program={program} animateIn />
          ))}
        </div>
      ) : null}
    </>
  );
};
