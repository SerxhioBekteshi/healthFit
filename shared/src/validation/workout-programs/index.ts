import { z } from 'zod';
import { uploadedImageUrlSchema } from '../common';

export const workoutLevelSchema = z.enum(
  ['beginner', 'intermediate', 'advanced'],
  { error: 'Select a valid difficulty level.' }
);

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required.').max(100),
  icon: z.string().trim().max(30),
  imageUrl: uploadedImageUrlSchema.optional(),
  sets: z.number().int().min(1, 'Sets must be at least 1.').max(100),
  reps: z.number().int().min(1, 'Reps must be at least 1.').max(1000),
  weight: z.number().min(0, 'Weight cannot be negative.').max(1000),
  restSeconds: z.number().int().min(0, 'Rest cannot be negative.').max(3600),
  notes: z.string().trim().max(500),
});

export const workoutDaySchema = z.object({
  focus: z.string().trim().max(100),
  exercises: z.array(exerciseSchema).max(50),
});

export const workoutProgramFormSchema = z.object({
  name: z.string().trim().min(1, 'Program name is required.').max(100),
  level: workoutLevelSchema,
  description: z.string().trim().max(1000),
  imageUrl: uploadedImageUrlSchema.optional(),
  sessionsPerWeek: z
    .number({ error: 'Sessions per week must be a number.' })
    .int('Sessions per week must be a whole number.')
    .min(1, 'At least 1 session per week is required.')
    .max(7, 'Maximum 7 sessions per week.'),
});

export type WorkoutProgramFormValues = z.infer<typeof workoutProgramFormSchema>;

export const workoutProgramInputSchema = workoutProgramFormSchema
  .extend({ days: z.array(workoutDaySchema).min(1).max(7) })
  .refine((program) => program.days.length === program.sessionsPerWeek, {
    message: 'A program needs one training day per weekly session.',
    path: ['days'],
  });

export type WorkoutProgramInput = z.infer<typeof workoutProgramInputSchema>;
