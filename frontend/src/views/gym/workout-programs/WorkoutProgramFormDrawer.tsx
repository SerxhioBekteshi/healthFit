import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { ImageField } from '@/components/common/ImageField';
import { ProgramCover } from '@/components/workout-programs/ProgramCover';
import { t } from '@/i18n';
import { WorkoutDayFields, emptyExercise } from './WorkoutDayFields';
import type { WorkoutLevel, WorkoutProgram } from '@gym/shared/types';
import {
  workoutLevelLabels,
  workoutLevels,
} from '@/utils/constants/workout-levels';
import {
  workoutProgramInputSchema,
  type WorkoutProgramInput,
} from '@gym/shared/validation/workout-programs';

interface WorkoutProgramFormDrawerProps {
  isOpen: boolean;
  program: WorkoutProgram | null;
  defaultLevel: WorkoutLevel;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: WorkoutProgramInput) => Promise<void>;
  onClose: () => void;
}

const emptyDay = (): WorkoutProgramInput['days'][number] => ({
  focus: '',
  exercises: [{ ...emptyExercise }],
});

const buildValues = (
  program: WorkoutProgram | null,
  level: WorkoutLevel
): WorkoutProgramInput =>
  program
    ? {
        name: program.name,
        level: program.level,
        description: program.description,
        imageUrl: program.imageUrl,
        sessionsPerWeek: program.sessionsPerWeek,
        days: program.days.map((day) => ({
          focus: day.focus,
          exercises: day.exercises.map((exercise) => ({
            name: exercise.name,
            icon: exercise.icon,
            imageUrl: exercise.imageUrl,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            restSeconds: exercise.restSeconds,
            notes: exercise.notes,
          })),
        })),
      }
    : {
        name: '',
        level,
        description: '',
        imageUrl: '',
        sessionsPerWeek: 3,
        days: [emptyDay(), emptyDay(), emptyDay()],
      };

export const WorkoutProgramFormDrawer: React.FC<
  WorkoutProgramFormDrawerProps
> = ({
  isOpen,
  program,
  defaultLevel,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors },
  } = useForm<WorkoutProgramInput>({
    resolver: zodResolver(workoutProgramInputSchema),
    defaultValues: buildValues(null, defaultLevel),
  });
  const { fields: dayFields, replace } = useFieldArray({
    control,
    name: 'days',
  });
  const level = useWatch({ control, name: 'level' });

  useEffect(() => {
    if (isOpen) {
      reset(buildValues(program, defaultLevel));
    }
  }, [program, defaultLevel, isOpen, reset]);

  // The number of training days always follows sessions per week.
  const resizeDays = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const count = Math.max(1, Math.min(7, Number(event.target.value) || 1));
    const current = getValues('days');
    replace(
      Array.from({ length: count }, (_, index) => current[index] ?? emptyDay())
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      title={program ? t('Edit Program') : t('Create Program')}
      description={t('Set weekly volume and design each training day.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={program ? t('Update program') : t('Create program')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="program-name"
          label={t('Program Name')}
          error={errors.name?.message}
        >
          <input
            id="program-name"
            className={fieldInputClass}
            {...register('name')}
          />
        </FormField>

        <Controller
          control={control}
          name="imageUrl"
          render={({ field }) => (
            <ImageField
              label={t('cover photo')}
              value={field.value ?? ''}
              onChange={field.onChange}
              preview={
                <ProgramCover
                  level={level}
                  imageUrl={field.value ?? ''}
                  className="h-16 w-28"
                />
              }
            />
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="program-level"
            label={t('Level')}
            error={errors.level?.message}
          >
            <select
              id="program-level"
              className={fieldInputClass}
              {...register('level')}
            >
              {workoutLevels.map((level) => (
                <option key={level} value={level}>
                  {workoutLevelLabels[level]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            id="program-sessions"
            label={t('Sessions / Week')}
            error={errors.sessionsPerWeek?.message}
          >
            <input
              id="program-sessions"
              type="number"
              min={1}
              max={7}
              className={fieldInputClass}
              {...register('sessionsPerWeek', {
                valueAsNumber: true,
                onChange: resizeDays,
              })}
            />
          </FormField>
        </div>

        <FormField
          id="program-description"
          label={t('Description')}
          error={errors.description?.message}
        >
          <textarea
            id="program-description"
            rows={2}
            className={fieldInputClass}
            {...register('description')}
          />
        </FormField>

        <div className="space-y-4">
          <p className="text-sm font-medium text-bone/70">
            {t('Training days')}
          </p>
          {dayFields.map((field, dayIndex) => (
            <WorkoutDayFields
              key={field.id}
              dayIndex={dayIndex}
              control={control}
              register={register}
              errors={errors}
            />
          ))}
          {errors.days?.message ? (
            <p className="text-xs text-danger">{errors.days.message}</p>
          ) : null}
        </div>
      </form>
    </Drawer>
  );
};
