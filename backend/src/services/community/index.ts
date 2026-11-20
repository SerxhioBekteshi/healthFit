import { ConflictError, NotFoundError } from '@/errors';
import type { CommunityContext } from '@/tenant/context';
import type { CommunityGyms, CommunityJoinResult } from '@gym/shared/types';
import type { CommunityGymsQuery } from '@gym/shared/validation/community';

// Explicit exception to "services use ctx.db": a community member has no gym yet, so there is no
// tenant to scope to. Only the list of active gyms is read, and only the member's own user row changes.
export const communityService = {
  // Suggests the gyms of one country: the one asked for, else the member's own, else all of them.
  async listGyms(
    ctx: CommunityContext,
    query: CommunityGymsQuery = {}
  ): Promise<CommunityGyms> {
    const member = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { country: true },
    });
    const country =
      query.country === 'all'
        ? null
        : (query.country ?? member?.country ?? null);

    const gyms = await ctx.db.gym.findMany({
      where: { isActive: true, ...(country ? { country } : {}) },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        location: true,
        country: true,
        currency: true,
        address: true,
        contactEmail: true,
        contactPhone: true,
        businessHours: true,
        opensAt: true,
        closesAt: true,
        logoUrl: true,
      },
    });
    return { country, gyms };
  },

  // The member picks where to start: they become a client of that gym with the details they signed up with.
  async join(
    ctx: CommunityContext,
    gymId: string
  ): Promise<CommunityJoinResult> {
    const gym = await ctx.db.gym.findFirst({
      where: { id: gymId, isActive: true },
      select: { id: true, name: true },
    });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }

    await ctx.db.$transaction(async (tx) => {
      // Only a user still without a gym moves, so a second request cannot join another gym.
      const moved = await tx.user.updateMany({
        where: { id: ctx.user.id, gymId: null },
        data: { gymId: gym.id },
      });
      if (moved.count === 0) {
        throw new ConflictError('You already belong to a gym.');
      }
      const user = await tx.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
      });
      await tx.client.create({
        data: {
          gymId: gym.id,
          userId: user.id,
          fullName: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
        },
      });
    });

    return { gymId: gym.id, gymName: gym.name };
  },
};
