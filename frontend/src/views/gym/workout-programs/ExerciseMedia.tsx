import React from 'react';
import {
  Controller,
  useWatch,
  type Control,
  type UseFormRegister,
} from 'react-hook-form';
import { fieldInputClass } from '@/components/common/FormField';
import { ImageField } from '@/components/common/ImageField';
import { ExerciseImage } from '@/components/workout-programs/ExerciseImage';
import { t } from '@/i18n';
import { EXERCISE_ICONS } from '@/utils/constants/exercise-icons';
import type { WorkoutProgramInput } from '@gym/shared/validation/workout-programs';

interface ExerciseMediaProps {
  control: Control<WorkoutProgramInput>;
  register: UseFormRegister<WorkoutProgramInput>;
  base: `days.${number}.exercises.${number}`;
}

// Picks the default movement figure and lets the gym replace it with its own photo.
export const ExerciseMedia: React.FC<ExerciseMediaProps> = ({
  control,
  register,
  base,
}) => {
  const icon = useWatch({ control, name: `${base}.icon` });

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium text-bone/50">
        {t('Movement')}
        <select
          className={`${fieldInputClass} mt-1.5 !rounded-lg !px-2.5 !py-1.5`}
          {...register(`${base}.icon`)}
        >
          {EXERCISE_ICONS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <Controller
        control={control}
        name={`${base}.imageUrl`}
        render={({ field }) => (
          <ImageField
            label={t('photo')}
            value={field.value ?? ''}
            onChange={field.onChange}
            preview={
              <ExerciseImage
                icon={icon}
                imageUrl={field.value ?? ''}
                className="h-14 w-14"
              />
            }
          />
        )}
      />
    </div>
  );
};
