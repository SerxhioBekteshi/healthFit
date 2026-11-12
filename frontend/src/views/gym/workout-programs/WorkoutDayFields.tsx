import React from 'react';
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { WorkoutProgramInput } from '@gym/shared/validation/workout-programs';
import { ExerciseMedia } from './ExerciseMedia';

interface WorkoutDayFieldsProps {
  dayIndex: number;
  control: Control<WorkoutProgramInput>;
  register: UseFormRegister<WorkoutProgramInput>;
  errors: FieldErrors<WorkoutProgramInput>;
}

export const emptyExercise: WorkoutProgramInput['days'][number]['exercises'][number] =
  {
    name: '',
    icon: 'curl',
    imageUrl: '',
    sets: 3,
    reps: 10,
    weight: 0,
    restSeconds: 60,
    notes: '',
  };

const smallInput = `${fieldInputClass} mt-1.5 !rounded-lg !px-2.5 !py-1.5`;
const smallLabel = 'text-xs font-medium text-bone/50';

export const WorkoutDayFields: React.FC<WorkoutDayFieldsProps> = ({
  dayIndex,
  control,
  register,
  errors,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `days.${dayIndex}.exercises`,
  });
  const dayErrors = errors.days?.[dayIndex];

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-signal">
          {t('Day {{n}}', { n: dayIndex + 1 })}
        </p>
        <input
          type="text"
          placeholder={t('Focus (e.g. Chest & Triceps)')}
          className={`${fieldInputClass} md:max-w-xs`}
          {...register(`days.${dayIndex}.focus`)}
        />
      </div>

      <div className="mt-4 space-y-3">
        {fields.map((field, exerciseIndex) => {
          const base = `days.${dayIndex}.exercises.${exerciseIndex}` as const;
          const rowErrors = dayErrors?.exercises?.[exerciseIndex];
          const firstError =
            rowErrors?.name?.message ??
            rowErrors?.sets?.message ??
            rowErrors?.reps?.message ??
            rowErrors?.weight?.message ??
            rowErrors?.restSeconds?.message;

          return (
            <div
              key={field.id}
              className="rounded-xl border border-white/[0.08] bg-ink/60 p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t('Exercise (e.g. Barbell Bench Press)')}
                  className={fieldInputClass}
                  {...register(`${base}.name`)}
                />
                <Button
                  size="sm"
                  variant="danger"
                  icon="trash"
                  aria-label={t('Remove exercise')}
                  onClick={() => remove(exerciseIndex)}
                />
              </div>

              <ExerciseMedia
                control={control}
                register={register}
                base={base}
              />

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                <label className={smallLabel}>
                  {t('Sets')}
                  <input
                    type="number"
                    min={1}
                    className={smallInput}
                    {...register(`${base}.sets`, { valueAsNumber: true })}
                  />
                </label>
                <label className={smallLabel}>
                  {t('Reps')}
                  <input
                    type="number"
                    min={1}
                    className={smallInput}
                    {...register(`${base}.reps`, { valueAsNumber: true })}
                  />
                </label>
                <label className={smallLabel}>
                  {t('Weight (kg)')}
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    className={smallInput}
                    {...register(`${base}.weight`, { valueAsNumber: true })}
                  />
                </label>
                <label className={smallLabel}>
                  {t('Rest (sec)')}
                  <input
                    type="number"
                    min={0}
                    className={smallInput}
                    {...register(`${base}.restSeconds`, {
                      valueAsNumber: true,
                    })}
                  />
                </label>
              </div>

              <label className={`${smallLabel} mt-3 block`}>
                {t('Description')}
                <textarea
                  rows={5}
                  maxLength={500}
                  placeholder={t(
                    'Starting position, how to move and a tip. Shown when a member opens the exercise.'
                  )}
                  className={smallInput}
                  {...register(`${base}.notes`)}
                />
              </label>
              {firstError ? (
                <p className="mt-1.5 text-xs text-danger">{firstError}</p>
              ) : null}
            </div>
          );
        })}

        <Button
          size="sm"
          variant="secondary"
          icon="plus"
          onClick={() => append({ ...emptyExercise })}
        >
          {t('Add exercise')}
        </Button>
      </div>
    </div>
  );
};
