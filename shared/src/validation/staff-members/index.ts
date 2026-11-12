import { z } from 'zod';

export const staffMemberFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required.').max(100),
  specialty: z.string().trim().max(100),
});

export type StaffMemberFormValues = z.infer<typeof staffMemberFormSchema>;
