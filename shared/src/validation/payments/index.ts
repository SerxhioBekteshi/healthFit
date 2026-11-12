import { z } from 'zod';

export const cardSummarySchema = z.object({
  brand: z.enum(['visa', 'mastercard'], {
    error: 'Only Visa and Mastercard are accepted.',
  }),
  last4: z.string().regex(/^\d{4}$/, 'Invalid card.'),
});
