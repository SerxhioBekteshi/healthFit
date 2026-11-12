import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';
import type { Exercise, WorkoutProgram } from '@gym/shared/types';
import { ExerciseImage } from './ExerciseImage';
import { ExerciseModal } from './ExerciseModal';
import { ProgramCover } from './ProgramCover';
import {
  workoutLevelLabels,
  workoutLevelTone,
} from '@/utils/constants/workout-levels';

interface WorkoutProgramCardProps {
  program: WorkoutProgram;
  // Admin actions; omitted for the read-only client view.
  actions?: React.ReactNode;
  animateIn?: boolean;
}

export const WorkoutProgramCard: React.FC<WorkoutProgramCardProps> = ({
  program,
  actions,
  animateIn = false,
}) => {
  const [viewing, setViewing] = useState<Exercise | null>(null);

  return (
    <article
      className={`rounded-xl border border-white/10 bg-panel p-5 shadow-sm sm:p-6 ${
        animateIn ? 'client-card-reveal' : ''
      }`}
    >
      <ProgramCover
        level={program.level}
        imageUrl={program.imageUrl}
        name={program.name}
        className="mb-5 h-36 w-full"
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-bone">{program.name}</h3>
            <Badge tone={workoutLevelTone[program.level]}>
              {workoutLevelLabels[program.level]}
            </Badge>
          </div>
          {program.description ? (
            <p className="mt-2 max-w-2xl text-sm text-bone/60">
              {program.description}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-bone/45">
            {t('{{n}} sessions / week', { n: program.sessionsPerWeek })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {program.days.map((day) => (
          <div
            key={day.id}
            className="rounded-xl border border-white/[0.08] bg-ink/60 p-4"
          >
            <p className="text-xs font-semibold text-signal">
              {t('Day {{n}}', { n: day.dayNumber })}
            </p>
            <p className="mt-1 text-sm font-semibold text-bone">{day.focus}</p>
            <ul className="mt-3 space-y-2 text-xs text-bone/70">
              {day.exercises.map((exercise) => (
                <li key={exercise.id} className="flex items-start gap-2.5">
                  <ExerciseImage
                    icon={exercise.icon}
                    imageUrl={exercise.imageUrl}
                    name={exercise.name}
                    className="h-10 w-10"
                  />
                  <span>
                    <span className="text-bone">{exercise.name}</span> —{' '}
                    {exercise.sets}×{exercise.reps}
                    {exercise.weight > 0
                      ? ` ${t('@ {{weight}}kg', { weight: exercise.weight })}`
                      : ''}
                    {exercise.restSeconds > 0
                      ? `, ${t('{{n}}s rest', { n: exercise.restSeconds })}`
                      : ''}
                    <button
                      type="button"
                      onClick={() => setViewing(exercise)}
                      className="mt-1 flex items-center gap-1 font-medium text-signal hover:underline"
                    >
                      {t('View full exercise')}
                      <Icon name="chevron" className="h-3 w-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ExerciseModal exercise={viewing} onClose={() => setViewing(null)} />
    </article>
  );
};
