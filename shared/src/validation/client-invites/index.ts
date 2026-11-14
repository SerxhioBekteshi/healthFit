import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

// What the API accepts.
export const acceptClientInviteSchema = z.object({ password });

// The form adds a confirmation field.
export const acceptClientInviteFormSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Confirmation must match the new password.',
    path: ['confirmPassword'],
  });

export type AcceptClientInviteFormValues = z.infer<
  typeof acceptClientInviteFormSchema
>;
