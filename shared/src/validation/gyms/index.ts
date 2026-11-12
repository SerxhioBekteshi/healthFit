import { z } from 'zod';

const emptyOr = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || pattern.test(value), message);

const isUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isTimezone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use the format HH:MM.');

export const COUNTRY_CODES = ['AL', 'GB', 'IT', 'DE', 'GR'] as const;

export const gymFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Gym name is required.'),
    location: z.string().trim().min(1, 'Location is required.'),
    country: z.enum(COUNTRY_CODES, { error: 'Choose the country.' }),
    businessHours: z.string().trim().min(1, 'Business hours are required.'),
    opensAt: timeOfDay,
    closesAt: timeOfDay,
    timezone: z.string().refine(isTimezone, 'Enter a valid timezone.'),
    logoUrl: z
      .string()
      .trim()
      .refine((value) => value === '' || isUrl(value), 'Enter a valid URL.'),
    address: z.string().trim(),
    contactEmail: emptyOr(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email.'),
    contactPhone: z.string().trim(),
    subdomain: emptyOr(
      /^[a-z0-9-]+$/,
      'Subdomain can only contain lowercase letters, numbers, and hyphens.'
    ),
    customDomain: emptyOr(
      /^([a-z0-9-]+\.)+[a-z]{2,}$/i,
      'Enter a valid domain (e.g. yourgym.com).'
    ),
  })
  .refine((gym) => gym.opensAt < gym.closesAt, {
    message: 'Closing time must be after opening time.',
    path: ['closesAt'],
  });

export type GymFormValues = z.infer<typeof gymFormSchema>;

export const gymStatusSchema = z.object({ isActive: z.boolean() });
