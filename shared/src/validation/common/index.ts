import { z } from 'zod';

export const paymentMethodSchema = z.enum(
  ['cash', 'card', 'bank_transfer', 'online', 'balance'],
  { error: 'Select a valid payment method.' }
);

export const genderSchema = z.enum(['male', 'female'], {
  error: 'Select male or female.',
});

export const isoDateSchema = z.iso.date('Enter a valid date.');

// The rule for every password a person chooses themselves.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

export const activeStatusSchema = z.object({ isActive: z.boolean() });

// Path returned by `POST /uploads`; an empty string means no image.
export const uploadedImageUrlSchema = z
  .string()
  .max(200)
  .regex(
    /^(\/uploads\/[A-Za-z0-9_-]+\/[A-Za-z0-9-]+\.(jpg|png|webp))?$/,
    'Invalid image.'
  );
