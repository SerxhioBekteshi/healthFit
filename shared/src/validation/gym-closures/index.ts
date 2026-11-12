import { z } from 'zod';
import { isoDateSchema } from '../common';

export const gymClosureFormSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    reason: z.string().trim().min(1, 'Reason is required.'),
  })
  .refine((closure) => closure.endDate >= closure.startDate, {
    message: 'End date must be the same or after start date.',
    path: ['endDate'],
  });

export type GymClosureFormValues = z.infer<typeof gymClosureFormSchema>;
