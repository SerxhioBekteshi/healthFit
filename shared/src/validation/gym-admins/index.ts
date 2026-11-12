import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

const baseFields = {
  fullName: z.string().trim().min(1, 'Full name is required.'),
  email: z.email('Enter a valid email address.'),
  assignedGymId: z.string().min(1, 'Assigned gym is required.'),
};

export const createGymAdminSchema = z.object({ ...baseFields, password });

// On update an empty password keeps the current one.
export const updateGymAdminSchema = z.object({
  ...baseFields,
  password: z.union([z.literal(''), password]),
});

export type CreateGymAdminValues = z.infer<typeof createGymAdminSchema>;
export type UpdateGymAdminValues = z.infer<typeof updateGymAdminSchema>;
