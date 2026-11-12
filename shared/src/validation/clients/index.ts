import { z } from 'zod';
import { genderSchema } from '../common';

const baseFields = {
  fullName: z.string().trim().min(1, 'Full name is required.'),
  email: z.email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, 'Enter a valid phone number.'),
  gender: genderSchema,
};

export const createClientSchema = z.object({
  ...baseFields,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
    .regex(/[0-9]/, 'Password must contain a number.'),
});

export const updateClientSchema = z.object(baseFields);

export const clientStatusSchema = z.object({ isActive: z.boolean() });

export type CreateClientValues = z.infer<typeof createClientSchema>;
export type UpdateClientValues = z.infer<typeof updateClientSchema>;
