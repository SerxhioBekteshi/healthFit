import { NotFoundError, ValidationError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type { AccessSettings } from '@gym/shared/types';
import type { AccessSettingsValues } from '@gym/shared/validation/access-settings';

export const accessSettingsService = {
  // Members read it too, to know whether lockers lock with their card.
  async get(ctx: TenantContext): Promise<AccessSettings> {
    const gym = await ctx.db.gym.findFirst({ where: { id: ctx.gymId } });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }
    return {
      cardsEnabled: gym.cardsEnabled,
      lockersEnabled: gym.lockersEnabled,
      lockersUseCard: gym.lockersUseCard,
    };
  },

  async update(
    ctx: TenantContext,
    input: AccessSettingsValues
  ): Promise<AccessSettings> {
    await ctx.db.gym.updateMany({
      where: { id: ctx.gymId },
      data: {
        cardsEnabled: input.cardsEnabled,
        lockersEnabled: input.lockersEnabled,
        lockersUseCard: input.lockersUseCard,
      },
    });
    return accessSettingsService.get(ctx);
  },

  async assertCardsEnabled(ctx: TenantContext): Promise<void> {
    if (!(await accessSettingsService.get(ctx)).cardsEnabled) {
      throw new ValidationError('Member cards are not used at this gym.');
    }
  },
};
