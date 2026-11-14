import { z } from 'zod';

export const MAX_LOCKERS_PER_RANGE = 300;

export const lockerRangeSchema = z
  .object({
    locationId: z.string().trim().min(1, 'Select a gym location.'),
    // Put in front of each number, for example "M" for M1, M2, ...
    prefix: z
      .string()
      .trim()
      .max(4, 'The prefix is too long.')
      .regex(/^[A-Za-z0-9]*$/, 'The prefix can only have letters and numbers.'),
    from: z
      .number({ error: 'Enter the first locker number.' })
      .int('Locker numbers are whole numbers.')
      .min(0, 'Locker numbers cannot be negative.')
      .max(99999, 'That locker number is too high.'),
    to: z
      .number({ error: 'Enter the last locker number.' })
      .int('Locker numbers are whole numbers.')
      .min(0, 'Locker numbers cannot be negative.')
      .max(99999, 'That locker number is too high.'),
  })
  .refine((range) => range.to >= range.from, {
    message: 'The last number must be the same or after the first.',
    path: ['to'],
  })
  .refine((range) => range.to - range.from < MAX_LOCKERS_PER_RANGE, {
    message: `Add at most ${MAX_LOCKERS_PER_RANGE} lockers at a time.`,
    path: ['to'],
  });

export type LockerRangeValues = z.infer<typeof lockerRangeSchema>;

export const assignLockerSchema = z.object({
  lockerNumber: z.string().trim().min(1, 'Enter the locker number.').max(12),
  // Card number or member code; staff send it, a member's own request leaves it out.
  code: z.string().trim().min(1).optional(),
});

export type AssignLockerValues = z.infer<typeof assignLockerSchema>;

export const releaseLockerSchema = z.object({
  code: z.string().trim().min(1).optional(),
});

export type ReleaseLockerValues = z.infer<typeof releaseLockerSchema>;
