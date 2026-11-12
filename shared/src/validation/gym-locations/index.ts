import { z } from 'zod';

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export const gymLocationFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  address: z.string().trim().min(1, 'Address is required.'),
  phone: z.string().trim(),
  latitude: z
    .number({ error: 'Pick the gym on the map.' })
    .min(-90, 'Latitude must be between -90 and 90.')
    .max(90, 'Latitude must be between -90 and 90.'),
  longitude: z
    .number({ error: 'Pick the gym on the map.' })
    .min(-180, 'Longitude must be between -180 and 180.')
    .max(180, 'Longitude must be between -180 and 180.'),
  mapUrl: z
    .string()
    .trim()
    .max(500, 'The link is too long.')
    .refine(
      (value) => value === '' || isHttpsUrl(value),
      'Enter a valid https link.'
    ),
});

export type GymLocationFormValues = z.infer<typeof gymLocationFormSchema>;
