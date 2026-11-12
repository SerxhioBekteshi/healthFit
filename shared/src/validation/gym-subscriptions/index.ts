import { z } from 'zod';
import { isoDateSchema } from '../common';

const cycleSchema = z.enum(['monthly', 'yearly'], {
  error: 'Select a valid billing cycle.',
});

const planFields = {
  planName: z.string().trim().min(1, 'Plan name is required.').max(100),
  cycle: cycleSchema,
  price: z
    .number({ error: 'Price must be a number.' })
    .min(0, 'Price cannot be negative.')
    .max(100000, 'Price is too high.'),
};

export const createGymSubscriptionSchema = z.object({
  gymId: z.string().min(1, 'Gym is required.'),
  startDate: isoDateSchema,
  ...planFields,
});

export const updateGymSubscriptionSchema = z.object(planFields);

// Only these transitions are manual; past due is derived from the due date.
export const subscriptionStatusSchema = z.object({
  status: z.enum(['active', 'cancelled']),
});

// The amount is never taken from the request: a payment settles one period at the plan price.
export const subscriptionPaymentSchema = z.object({
  paymentMethod: z.enum(['card', 'bank_transfer', 'online'], {
    error: 'Select a valid payment method.',
  }),
});

export type CreateGymSubscriptionValues = z.infer<
  typeof createGymSubscriptionSchema
>;
export type UpdateGymSubscriptionValues = z.infer<
  typeof updateGymSubscriptionSchema
>;
export type SubscriptionPaymentValues = z.infer<
  typeof subscriptionPaymentSchema
>;
