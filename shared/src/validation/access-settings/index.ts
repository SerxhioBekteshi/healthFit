import { z } from 'zod';

export const accessSettingsSchema = z
  .object({
    cardsEnabled: z.boolean(),
    lockersEnabled: z.boolean(),
    lockersUseCard: z.boolean(),
  })
  .refine(
    (settings) =>
      !settings.lockersUseCard ||
      (settings.cardsEnabled && settings.lockersEnabled),
    {
      message: 'Locking lockers with a card needs cards and lockers turned on.',
      path: ['lockersUseCard'],
    }
  );

export type AccessSettingsValues = z.infer<typeof accessSettingsSchema>;
