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

// The gym never sets a password: the client chooses their own through the invite link or by signing up.
export const createClientSchema = z.object(baseFields);

export const updateClientSchema = z.object(baseFields);

export const clientStatusSchema = z.object({ isActive: z.boolean() });

export type CreateClientValues = z.infer<typeof createClientSchema>;
export type UpdateClientValues = z.infer<typeof updateClientSchema>;
