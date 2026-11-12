import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import {
  WEEKDAYS,
  weekdayLabels,
  weekdayShortLabels,
} from '@/utils/constants/weekdays';
import type { GymClass, StaffMember } from '@gym/shared/types';
import {
  classFormSchema,
  type ClassFormValues,
} from '@gym/shared/validation/classes';

interface ClassFormDrawerProps {
  isOpen: boolean;
  gymClass: GymClass | null;
  // Only staff that can be assigned right now.
  staffMembers: StaffMember[];
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: ClassFormValues) => Promise<void>;
  onClose: () => void;
}

const emptyValues: ClassFormValues = {
  name: '',
  description: '',
  weekdays: [],
  startTime: '18:00',
  endTime: '19:00',
  staffMemberId: '',
};

export const ClassFormDrawer: React.FC<ClassFormDrawerProps> = ({
  isOpen,
  gymClass,
  staffMembers,
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
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        gymClass
          ? {
              name: gymClass.name,
              description: gymClass.description,
              weekdays: gymClass.weekdays,
              startTime: gymClass.startTime,
              endTime: gymClass.endTime,
              staffMemberId: gymClass.staffMemberId ?? '',
            }
          : emptyValues
      );
    }
  }, [gymClass, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={gymClass ? t('Edit Class') : t('Add Class')}
      description={t('A class repeats every week on the days you choose.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={gymClass ? t('Update class') : t('Add class')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField id="name" label={t('Class')} error={errors.name?.message}>
          <input
            id="name"
            className={fieldInputClass}
            placeholder={t('Abs, Aerobics, Zumba...')}
            {...register('name')}
          />
        </FormField>

        <FormField
          id="description"
          label={t('Description')}
          error={errors.description?.message}
        >
          <textarea
            id="description"
            rows={3}
            maxLength={500}
            className={fieldInputClass}
            placeholder={t('What members can expect from this class.')}
            {...register('description')}
          />
        </FormField>

        <Controller
          control={control}
          name="weekdays"
          render={({ field }) => (
            <FormField
              id="weekdays"
              label={t('Days')}
              error={errors.weekdays?.message}
            >
              <div id="weekdays" className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const selected = field.value.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      aria-label={weekdayLabels[day]}
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((value) => value !== day)
                            : [...field.value, day]
                        )
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-signal bg-signal text-ink'
                          : 'border-white/15 text-bone/70 hover:bg-white/10'
                      }`}
                    >
                      {weekdayShortLabels[day]}
                    </button>
                  );
                })}
              </div>
            </FormField>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="startTime"
            label={t('Starts')}
            error={errors.startTime?.message}
          >
            <input
              id="startTime"
              type="time"
              className={fieldInputClass}
              {...register('startTime')}
            />
          </FormField>
          <FormField
            id="endTime"
            label={t('Ends')}
            error={errors.endTime?.message}
          >
            <input
              id="endTime"
              type="time"
              className={fieldInputClass}
              {...register('endTime')}
            />
          </FormField>
        </div>

        <FormField
          id="staffMemberId"
          label={t('Instructor')}
          error={errors.staffMemberId?.message}
        >
          <select
            id="staffMemberId"
            className={fieldInputClass}
            {...register('staffMemberId')}
          >
            <option value="">{t('No instructor yet')}</option>
            {staffMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
                {member.specialty ? ` — ${member.specialty}` : ''}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Drawer>
  );
};
