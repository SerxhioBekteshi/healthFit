import { z } from 'zod';

export const accessSettingsSchema = z
  .object({
    cardsEnabled: z.boolean(),
    lockersUseCard: z.boolean(),
  })
  .refine((settings) => !settings.lockersUseCard || settings.cardsEnabled, {
    message: 'Locking lockers with a card needs member cards turned on.',
    path: ['lockersUseCard'],
  });

export type AccessSettingsValues = z.infer<typeof accessSettingsSchema>;
