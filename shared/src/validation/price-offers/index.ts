import { z } from 'zod';
import { isoDateSchema } from '../common';

export const MAX_OFFER_ITEMS = 60;

export const priceOfferFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Offer name is required.')
      .max(80, 'Offer name is too long.'),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    items: z
      .array(
        z.object({
          planId: z.string().min(1, 'Select a plan.'),
          price: z
            .number({ error: 'Price must be a number.' })
            .gt(0, 'Price must be greater than 0.')
            .max(100000, 'Price is too high.'),
        })
      )
      .min(1, 'Add at least one plan to the offer.')
      .max(MAX_OFFER_ITEMS, 'Too many plans in one offer.'),
  })
  .refine((offer) => offer.endDate >= offer.startDate, {
    message: 'End date must be the same or after start date.',
    path: ['endDate'],
  })
  .refine(
    (offer) =>
      new Set(offer.items.map((item) => item.planId)).size ===
      offer.items.length,
    { message: 'A plan can only be in an offer once.', path: ['items'] }
  );

export type PriceOfferFormValues = z.infer<typeof priceOfferFormSchema>;
