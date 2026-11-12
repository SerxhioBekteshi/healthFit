import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .regex(/[A-Z]/, 'New password must contain an uppercase letter.')
      .regex(/[0-9]/, 'New password must contain a number.'),
    confirmPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Confirmation must match the new password.',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
