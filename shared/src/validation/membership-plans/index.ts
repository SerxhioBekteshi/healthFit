import { z } from 'zod';
import { genderSchema } from '../common';

export const membershipPlanTypeSchema = z.enum(
  [
    'monthly',
    'three_months',
    'six_months',
    'yearly',
    'visit_based',
    'personal_training',
  ],
  { error: 'Select a valid plan type.' }
);

export const membershipPlanFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Plan name is required.'),
    type: membershipPlanTypeSchema,
    durationDays: z
      .number({ error: 'Duration must be a number.' })
      .int('Duration must be a whole number of days.')
      .min(1, 'Duration must be at least 1 day.'),
    visitCount: z
      .number({ error: 'Visit count must be a number.' })
      .int('Visit count must be a whole number.')
      .min(0, 'Visit count cannot be negative.'),
    gender: genderSchema,
    // 0 means no weekly cap.
    weeklyVisits: z
      .number({ error: 'Weekly visits must be a number.' })
      .int('Weekly visits must be a whole number.')
      .min(0, 'Weekly visits cannot be negative.')
      .max(7, 'A week has 7 days.'),
    price: z
      .number({ error: 'Price must be a number.' })
      .min(0, 'Price cannot be negative.')
      .max(100000, 'Price is too high.'),
  })
  .refine((plan) => plan.type !== 'visit_based' || plan.visitCount >= 1, {
    message: 'Visit-based plans need at least 1 visit.',
    path: ['visitCount'],
  });

export type MembershipPlanFormValues = z.infer<typeof membershipPlanFormSchema>;

// Terms that make up the standard price list (rows of the price table).
export const planTermSchema = z.enum([
  'monthly',
  'three_months',
  'six_months',
  'yearly',
]);

// One price list for one gender: a price per weekly frequency and term.
export const priceGridSchema = z.object({
  gender: genderSchema,
  cells: z
    .array(
      z.object({
        weeklyVisits: z
          .number()
          .int('Weekly visits must be a whole number.')
          .min(0)
          .max(7),
        type: planTermSchema,
        // null or 0 takes the price off the list.
        price: z
          .number({ error: 'Price must be a number.' })
          .min(0, 'Price cannot be negative.')
          .max(100000, 'Price is too high.')
          .nullable(),
      })
    )
    .max(60, 'Too many prices.'),
});

export type PriceGridValues = z.infer<typeof priceGridSchema>;
