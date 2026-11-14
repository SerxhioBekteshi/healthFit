import type { Currency, PaymentMethod } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type { PaymentSettings } from '@gym/shared/types';
import type { PaymentSettingsValues } from '@gym/shared/validation/payment-settings';

export const paymentSettingsService = {
  // The one currency every amount of the gym is in.
  async currencyOf(ctx: TenantContext): Promise<Currency> {
    const gym = await ctx.db.gym.findFirst({
      where: { id: ctx.gymId },
      select: { currency: true },
    });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }
    return gym.currency;
  },

  // Members read it too, to show only the ways they can pay.
  async get(ctx: TenantContext): Promise<PaymentSettings> {
    const gym = await ctx.db.gym.findFirst({ where: { id: ctx.gymId } });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }
    return {
      acceptCard: gym.acceptCard,
      acceptBalance: gym.acceptBalance,
      acceptCash: gym.acceptCash,
    };
  },

  async update(
    ctx: TenantContext,
    input: PaymentSettingsValues
  ): Promise<PaymentSettings> {
    await ctx.db.gym.updateMany({
      where: { id: ctx.gymId },
      data: {
        acceptCard: input.acceptCard,
        acceptBalance: input.acceptBalance,
        acceptCash: input.acceptCash,
      },
    });
    return paymentSettingsService.get(ctx);
  },

  // Refuses a payment method the gym has turned off; bank transfer and online are not configurable.
  async assertAccepted(
    ctx: TenantContext,
    method: PaymentMethod
  ): Promise<void> {
    if (method !== 'card' && method !== 'balance' && method !== 'cash') {
      return;
    }
    const settings = await paymentSettingsService.get(ctx);
    if (method === 'card' && !settings.acceptCard) {
      throw new ValidationError('Card payments are not accepted by this gym.');
    }
    if (method === 'balance' && !settings.acceptBalance) {
      throw new ValidationError(
        'Paying from the balance is not accepted by this gym.'
      );
    }
    if (method === 'cash' && !settings.acceptCash) {
      throw new ValidationError('Cash payments are not accepted by this gym.');
    }
  },

  // Top-ups only make sense while the gym lets members pay from their balance.
  async assertBalanceInUse(ctx: TenantContext): Promise<void> {
    const settings = await paymentSettingsService.get(ctx);
    if (!settings.acceptBalance) {
      throw new ValidationError('This gym does not use balance credit.');
    }
  },
};
