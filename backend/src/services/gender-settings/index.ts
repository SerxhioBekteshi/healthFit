import { NotFoundError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type { GenderSettings } from '@gym/shared/types';
import type { GenderSettingsValues } from '@gym/shared/validation/gender-settings';

export const genderSettingsService = {
  async get(ctx: TenantContext): Promise<GenderSettings> {
    const gym = await ctx.db.gym.findFirst({ where: { id: ctx.gymId } });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }
    return {
      samePricesForGenders: gym.samePricesForGenders,
      sameLockersForGenders: gym.sameLockersForGenders,
    };
  },

  async update(
    ctx: TenantContext,
    input: GenderSettingsValues
  ): Promise<GenderSettings> {
    await ctx.db.gym.updateMany({
      where: { id: ctx.gymId },
      data: {
        samePricesForGenders: input.samePricesForGenders,
        sameLockersForGenders: input.sameLockersForGenders,
      },
    });
    return genderSettingsService.get(ctx);
  },

  // Whether the standard price grid should mirror between men and women.
  async isSamePricesForBothGenders(ctx: TenantContext): Promise<boolean> {
    return (await genderSettingsService.get(ctx)).samePricesForGenders;
  },

  // Whether a new locker range should mirror between men and women.
  async isSameLockersForBothGenders(ctx: TenantContext): Promise<boolean> {
    return (await genderSettingsService.get(ctx)).sameLockersForGenders;
  },
};
