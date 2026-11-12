import { hashPassword } from 'better-auth/crypto';
import type { Gym, User } from '@prisma/client';
import { createCredentialUser } from '@/auth/credentials';
import type { PlatformContext } from '@/tenant/context';
import { ConflictError, NotFoundError, isUniqueViolation } from '@/errors';
import type { GymAdmin } from '@gym/shared/types';
import type {
  CreateGymAdminValues,
  UpdateGymAdminValues,
} from '@gym/shared/validation/gym-admins';

type AdminRow = User & { gym: Gym | null };

const toDto = (row: AdminRow): GymAdmin => ({
  id: row.id,
  fullName: row.name,
  email: row.email,
  assignedGymId: row.gymId ?? '',
  assignedGymName: row.gym?.name ?? '',
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const requireGym = async (ctx: PlatformContext, gymId: string) => {
  const gym = await ctx.db.gym.findUnique({ where: { id: gymId } });
  if (!gym) {
    throw new NotFoundError('The selected gym does not exist.');
  }
};

const emailTaken = (error: unknown): never => {
  if (isUniqueViolation(error)) {
    throw new ConflictError('An account with this email already exists.');
  }
  throw error;
};

export const gymAdminService = {
  async list(ctx: PlatformContext): Promise<GymAdmin[]> {
    const rows = await ctx.db.user.findMany({
      where: { role: 'gym_admin' },
      include: { gym: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  },

  async create(
    ctx: PlatformContext,
    input: CreateGymAdminValues
  ): Promise<GymAdmin> {
    await requireGym(ctx, input.assignedGymId);
    try {
      const user = await ctx.db.$transaction((tx) =>
        createCredentialUser(tx, {
          name: input.fullName,
          email: input.email,
          password: input.password,
          role: 'gym_admin',
          gymId: input.assignedGymId,
        })
      );
      const row = await ctx.db.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { gym: true },
      });
      return toDto(row);
    } catch (error) {
      return emailTaken(error);
    }
  },

  async update(
    ctx: PlatformContext,
    id: string,
    input: UpdateGymAdminValues
  ): Promise<GymAdmin> {
    const existing = await ctx.db.user.findFirst({
      where: { id, role: 'gym_admin' },
    });
    if (!existing) {
      throw new NotFoundError('Gym admin not found.');
    }
    await requireGym(ctx, input.assignedGymId);

    try {
      const row = await ctx.db.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data: {
            name: input.fullName,
            email: input.email.toLowerCase(),
            gymId: input.assignedGymId,
          },
          include: { gym: true },
        });
        if (input.password) {
          await tx.account.updateMany({
            where: { userId: id, providerId: 'credential' },
            data: { password: await hashPassword(input.password) },
          });
          await tx.session.deleteMany({ where: { userId: id } });
        }
        return updated;
      });
      return toDto(row);
    } catch (error) {
      return emailTaken(error);
    }
  },

  async remove(ctx: PlatformContext, id: string): Promise<void> {
    const result = await ctx.db.user.deleteMany({
      where: { id, role: 'gym_admin' },
    });
    if (result.count === 0) {
      throw new NotFoundError('Gym admin not found.');
    }
  },
};
