import { z } from 'zod';

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a time like 18:30.');

export const classFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Class name is required.').max(100),
    description: z.string().trim().max(500),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Select at least one day.'),
    startTime: timeSchema,
    endTime: timeSchema,
    // An empty string means no instructor yet.
    staffMemberId: z.string(),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: 'The class must end after it starts.',
    path: ['endTime'],
  });

export type ClassFormValues = z.infer<typeof classFormSchema>;
