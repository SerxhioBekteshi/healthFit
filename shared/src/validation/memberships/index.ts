import { z } from 'zod';
import { isoDateSchema } from '../common';
import { cardSummarySchema } from '../payments';

// Staff record a payment taken at the counter. Which methods are allowed depends on the gym's payment settings.
const staffPaymentSchema = z.enum(['cash', 'card', 'balance'], {
  error: 'Select a valid payment method.',
});

const needsCardSummary = {
  message: 'Enter the card details.',
  path: ['card'],
};

export const createMembershipSchema = z
  .object({
    clientId: z.string().min(1, 'Client is required.'),
    planId: z.string().min(1, 'Plan is required.'),
    startDate: isoDateSchema,
    paymentMethod: staffPaymentSchema,
    card: cardSummarySchema.optional(),
  })
  .refine(
    (input) => input.paymentMethod !== 'card' || input.card !== undefined,
    needsCardSummary
  );

export const renewMembershipSchema = z
  .object({
    startDate: isoDateSchema,
    paymentMethod: staffPaymentSchema,
    card: cardSummarySchema.optional(),
  })
  .refine(
    (input) => input.paymentMethod !== 'card' || input.card !== undefined,
    needsCardSummary
  );

// A client subscribing on their own: credit or card. Cash is only taken by gym staff.
export const subscribeMembershipSchema = z
  .object({
    planId: z.string().min(1, 'Plan is required.'),
    paymentMethod: z.enum(['balance', 'card'], {
      error: 'Select a valid payment method.',
    }),
    card: cardSummarySchema.optional(),
  })
  .refine(
    (input) => input.paymentMethod !== 'card' || input.card !== undefined,
    { message: 'Enter the card details.', path: ['card'] }
  );

export type CreateMembershipValues = z.infer<typeof createMembershipSchema>;
export type RenewMembershipValues = z.infer<typeof renewMembershipSchema>;
export type SubscribeMembershipValues = z.infer<
  typeof subscribeMembershipSchema
>;

// `GET /memberships/history` query: paging and the history filters.
export const membershipHistoryQuerySchema = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z
      .enum(['pending', 'active', 'upcoming', 'expired', 'cancelled'])
      .optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'The start date must not be after the end date.',
    path: ['to'],
  });

export type MembershipHistoryQuery = z.infer<
  typeof membershipHistoryQuerySchema
>;
