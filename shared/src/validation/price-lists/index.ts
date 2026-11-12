import { z } from 'zod';

export const MAX_PRICE_LIST_NOTES = 8;
export const MAX_PRICE_LIST_PHOTOS = 12;

export const priceListNotesSchema = z.object({
  notes: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Notes cannot be empty.')
        .max(160, 'A note can have at most 160 characters.')
    )
    .max(MAX_PRICE_LIST_NOTES, `Use at most ${MAX_PRICE_LIST_NOTES} notes.`),
});

export type PriceListNotesValues = z.infer<typeof priceListNotesSchema>;
