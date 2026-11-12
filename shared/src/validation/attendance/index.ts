import { z } from 'zod';

export const checkInSchema = z.object({
  clientId: z.string().trim().min(1, 'Enter a check-in code.'),
  // Required when the gym has several active locations.
  locationId: z.string().trim().min(1).optional(),
});

export type CheckInValues = z.infer<typeof checkInSchema>;
