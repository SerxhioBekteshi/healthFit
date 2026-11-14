import { z } from 'zod';

export const checkInSchema = z.object({
  clientId: z.string().trim().min(1, 'Enter a check-in code.'),
  // Required when the gym has several active locations.
  locationId: z.string().trim().min(1).optional(),
});

export type CheckInValues = z.infer<typeof checkInSchema>;

// A member code or card number; the same scan checks a member in, or out when they are inside.
export const scanSchema = z.object({
  code: z.string().trim().min(1, 'Enter a check-in code.'),
  locationId: z.string().trim().min(1).optional(),
});

export type ScanValues = z.infer<typeof scanSchema>;

// Staff name the member; a member checking themselves out sends nothing.
export const checkOutSchema = z.object({
  clientId: z.string().trim().min(1).optional(),
});

export type CheckOutValues = z.infer<typeof checkOutSchema>;
