import React, { useState } from 'react';
import { ClassSchedule } from '@/components/training/ClassSchedule';
import { ProgramCard } from '@/components/training/ProgramCard';
import { ChipRow } from '@/components/ui/ChipRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useClasses } from '@/hooks/classes';
import { useRefresh } from '@/hooks/refresh';
import { useWorkoutPrograms } from '@/hooks/workout-programs';
import { useTranslation } from '@/i18n';
import { workoutLevelLabels } from '@/utils/labels';
import type { WorkoutLevel } from '@gym/shared/types';

type TrainingView = 'programs' | 'classes';

const LEVELS: WorkoutLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function TrainingScreen(): React.ReactElement {
  const { t } = useTranslation();
  const [view, setView] = useState<TrainingView>('programs');
  // No level is selected at first, so every program shows. Tapping a level filters; tapping it again clears it.
  const [level, setLevel] = useState<WorkoutLevel | null>(null);
  const programs = useWorkoutPrograms();
  const classes = useClasses();
  const { refreshing, onRefresh } = useRefresh(
    programs.refetch,
    classes.refetch
  );

  // Leaving the programs also goes back to the unfiltered list.
  const changeView = (next: TrainingView): void => {
    setView(next);
    setLevel(null);
  };

  return (
    <Screen
      title={t('Training')}
      subtitle={t('Workout programs and the weekly class timetable.')}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      <SegmentedControl
        options={[
          { value: 'programs', label: t('Programs') },
          { value: 'classes', label: t('Classes') },
        ]}
        value={view}
        onChange={changeView}
      />

      {view === 'programs' ? (
        <QueryBoundary query={programs}>
          {(list) => {
            if (list.length === 0) {
              return (
                <EmptyState
                  icon="barbell-outline"
                  title={t('No programs yet')}
                  message={t(
                    'Your gym has not published any workout programs.'
                  )}
                />
              );
            }
            const shown = level
              ? list.filter((program) => program.level === level)
              : list;
            return (
              <>
                <ChipRow
                  options={LEVELS.map((value) => ({
                    value,
                    label: workoutLevelLabels[value],
                  }))}
                  value={level}
                  onChange={(next) => setLevel(next === level ? null : next)}
                />
                {shown.length === 0 ? (
                  <EmptyState
                    icon="barbell-outline"
                    title={t('No programs for this level.')}
                  />
                ) : (
                  shown.map((program) => (
                    <ProgramCard key={program.id} program={program} />
                  ))
                )}
              </>
            );
          }}
        </QueryBoundary>
      ) : (
        <QueryBoundary query={classes}>
          {(list) => <ClassSchedule classes={list} />}
        </QueryBoundary>
      )}
    </Screen>
  );
}
