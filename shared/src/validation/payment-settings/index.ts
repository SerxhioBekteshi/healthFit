import { z } from 'zod';

export const paymentSettingsSchema = z
  .object({
    acceptCard: z.boolean(),
    acceptBalance: z.boolean(),
    acceptCash: z.boolean(),
  })
  .refine(
    (settings) =>
      settings.acceptCard || settings.acceptBalance || settings.acceptCash,
    {
      message: 'Keep at least one payment method on.',
      path: ['acceptCash'],
    }
  );

export type PaymentSettingsValues = z.infer<typeof paymentSettingsSchema>;
