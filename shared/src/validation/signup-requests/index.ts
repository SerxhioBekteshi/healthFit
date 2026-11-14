import { z } from 'zod';
import { COUNTRY_CODES } from '../gyms';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.');

export const signupRequestSchema = z.object({
  ownerName: z.string().trim().min(2, 'Full name is required.'),
  email: z.email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{6,20}$/, 'Enter a valid phone number.'),
  password,
  gymName: z.string().trim().min(2, 'Gym name is required.'),
  country: z.enum(COUNTRY_CODES, { error: 'Choose the country.' }),
  location: z.string().trim().min(2, 'City is required.'),
  address: z.string().trim().min(3, 'Address is required.'),
  locationsCount: z
    .number({ error: 'Enter how many locations you have.' })
    .int('Enter a whole number.')
    .min(1, 'You need at least 1 location.')
    .max(50, 'Contact us for more than 50 locations.'),
  notes: z.string().trim().max(1000, 'Keep it under 1000 characters.'),
  // Hidden field a person never fills in; bots do and are ignored.
  company: z.string().optional(),
});

export type SignupRequestValues = z.infer<typeof signupRequestSchema>;

export const rejectSignupRequestSchema = z.object({
  note: z.string().trim().max(500, 'Keep it under 500 characters.'),
});

export type RejectSignupRequestValues = z.infer<
  typeof rejectSignupRequestSchema
>;
