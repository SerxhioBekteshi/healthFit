import { z } from 'zod';

export const paymentMethodSchema = z.enum(
  ['cash', 'card', 'bank_transfer', 'online', 'balance'],
  { error: 'Select a valid payment method.' }
);

export const genderSchema = z.enum(['male', 'female'], {
  error: 'Select male or female.',
});

export const isoDateSchema = z.iso.date('Enter a valid date.');

export const activeStatusSchema = z.object({ isActive: z.boolean() });

// Path returned by `POST /uploads`; an empty string means no image.
export const uploadedImageUrlSchema = z
  .string()
  .max(200)
  .regex(
    /^(\/uploads\/[A-Za-z0-9_-]+\/[A-Za-z0-9-]+\.(jpg|png|webp))?$/,
    'Invalid image.'
  );
