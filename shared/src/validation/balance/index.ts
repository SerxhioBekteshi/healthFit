import { z } from 'zod';
import { isoDateSchema } from '../common';
import { cardSummarySchema } from '../payments';

// Same fields the form edits; a card payment also needs the card summary (see depositSchema).
export const depositFormSchema = z.object({
  amount: z
    .number({ error: 'Amount must be a number.' })
    .positive('Amount must be greater than zero.'),
  paymentMethod: z.enum(['cash', 'card'], {
    error: 'Select a valid payment method.',
  }),
  description: z.string().trim().max(200).optional(),
  // Used by gym admins to top up a member; ignored for clients.
  clientId: z.string().min(1).optional(),
  card: cardSummarySchema.optional(),
});

export const depositSchema = depositFormSchema.refine(
  (deposit) => deposit.paymentMethod !== 'card' || deposit.card !== undefined,
  { message: 'Enter the card details.', path: ['card'] }
);

export type DepositValues = z.infer<typeof depositSchema>;

// Query strings arrive as text, so numbers are coerced.
const amountQuery = z.coerce
  .number({ error: 'Enter a valid amount.' })
  .nonnegative('The amount cannot be negative.');

// `GET /balance` query: paging, optional member (gym admins) and the history filters.
export const balanceHistoryQuerySchema = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().positive().optional(),
    clientId: z.string().min(1).optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    minAmount: amountQuery.optional(),
    maxAmount: amountQuery.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: 'The start date must not be after the end date.',
    path: ['to'],
  })
  .refine(
    (query) =>
      query.minAmount === undefined ||
      query.maxAmount === undefined ||
      query.minAmount <= query.maxAmount,
    {
      message: 'The minimum amount must not exceed the maximum.',
      path: ['maxAmount'],
    }
  );

export type BalanceHistoryQuery = z.infer<typeof balanceHistoryQuerySchema>;
