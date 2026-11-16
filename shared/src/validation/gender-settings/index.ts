import { z } from 'zod';

export const genderSettingsSchema = z.object({
  samePricesForGenders: z.boolean(),
  sameLockersForGenders: z.boolean(),
});

export type GenderSettingsValues = z.infer<typeof genderSettingsSchema>;
