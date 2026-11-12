import type { Gym as GymRow } from '@prisma/client';
import type { PlatformContext } from '@/tenant/context';
import { ConflictError, NotFoundError, isUniqueViolation } from '@/errors';
import { classService } from '@/services/classes';
import { gymLocationService } from '@/services/gym-locations';
import type { Gym } from '@gym/shared/types';
import type { GymFormValues } from '@gym/shared/validation/gyms';

type GymWithAdmins = GymRow & { users: { email: string }[] };

const withAdmins = {
  users: { where: { role: 'gym_admin' as const }, select: { email: true } },
};

const toDto = (row: GymWithAdmins): Gym => ({
  id: row.id,
  name: row.name,
  location: row.location,
  country: row.country,
  businessHours: row.businessHours,
  opensAt: row.opensAt,
  closesAt: row.closesAt,
  timezone: row.timezone,
  adminEmails: row.users.map((user) => user.email),
  isActive: row.isActive,
  logoUrl: row.logoUrl,
  address: row.address,
  contactEmail: row.contactEmail,
  contactPhone: row.contactPhone,
  subdomain: row.subdomain ?? '',
  customDomain: row.customDomain ?? '',
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toData = (input: GymFormValues) => ({
  ...input,
  // Empty strings would collide on the unique index.
  subdomain: input.subdomain || null,
  customDomain: input.customDomain.toLowerCase() || null,
});

const rethrowConflict = (error: unknown): never => {
  if (isUniqueViolation(error)) {
    throw new ConflictError(
      'That subdomain or custom domain is already in use.'
    );
  }
  throw error;
};

export const gymService = {
  async list(ctx: PlatformContext): Promise<Gym[]> {
    const rows = await ctx.db.gym.findMany({
      include: withAdmins,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  },

  async create(ctx: PlatformContext, input: GymFormValues): Promise<Gym> {
    try {
      const row = await ctx.db.$transaction(async (tx) => {
        const created = await tx.gym.create({
          data: toData(input),
          include: withAdmins,
        });
        await classService.createDefaults(tx, created.id);
        await gymLocationService.createDefault(tx, created);
        return created;
      });
      return toDto(row);
    } catch (error) {
      return rethrowConflict(error);
    }
  },

  async update(
    ctx: PlatformContext,
    id: string,
    input: GymFormValues
  ): Promise<Gym> {
    const existing = await ctx.db.gym.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Gym not found.');
    }
    try {
      const row = await ctx.db.gym.update({
        where: { id },
        data: toData(input),
        include: withAdmins,
      });
      return toDto(row);
    } catch (error) {
      return rethrowConflict(error);
    }
  },

  async setActive(
    ctx: PlatformContext,
    id: string,
    isActive: boolean
  ): Promise<Gym> {
    const existing = await ctx.db.gym.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Gym not found.');
    }
    const row = await ctx.db.gym.update({
      where: { id },
      data: { isActive },
      include: withAdmins,
    });
    return toDto(row);
  },
};
