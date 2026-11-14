import type { Gym as GymRow, Prisma } from '@prisma/client';
import type { PlatformContext } from '@/tenant/context';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueViolation,
} from '@/errors';
import { classService } from '@/services/classes';
import { gymLocationService } from '@/services/gym-locations';
import { workoutProgramService } from '@/services/workout-programs';
import type { Gym } from '@gym/shared/types';
import {
  COUNTRY_CURRENCIES,
  type GymFormValues,
} from '@gym/shared/validation/gyms';

type GymWithAdmins = GymRow & { users: { email: string }[] };

const withAdmins = {
  users: { where: { role: 'gym_admin' as const }, select: { email: true } },
};

// Gyms that already hold prices or money; changing their country would change what the amounts mean.
const lockedGymIds = async (
  db: PlatformContext['db'],
  gymIds: string[]
): Promise<Set<string>> => {
  const args = {
    where: { gymId: { in: gymIds } },
    select: { gymId: true },
    distinct: ['gymId' as const],
  };
  const found = await Promise.all([
    db.membershipPlan.findMany(args),
    db.product.findMany(args),
    db.membership.findMany(args),
    db.balanceTransaction.findMany(args),
    db.productSale.findMany(args),
    db.gymSubscription.findMany(args),
    db.gymSubscriptionPayment.findMany(args),
  ]);
  return new Set(found.flat().map((row) => row.gymId));
};

const toDto = (row: GymWithAdmins, locked: boolean): Gym => ({
  id: row.id,
  name: row.name,
  location: row.location,
  country: row.country,
  currency: row.currency,
  countryLocked: locked,
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
  // The currency always follows the country; it is never sent by the client.
  currency: COUNTRY_CURRENCIES[input.country],
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
    const locked = await lockedGymIds(
      ctx.db,
      rows.map((row) => row.id)
    );
    return rows.map((row) => toDto(row, locked.has(row.id)));
  },

  // A new gym starts with the default timetable, workout programs and one location. Runs inside the caller's transaction.
  async createWithin(
    tx: Prisma.TransactionClient,
    input: GymFormValues
  ): Promise<GymWithAdmins> {
    const created = await tx.gym.create({
      data: toData(input),
      include: withAdmins,
    });
    await classService.createDefaults(tx, created.id);
    await workoutProgramService.createDefaults(tx, created.id);
    await gymLocationService.createDefault(tx, created);
    return created;
  },

  async create(ctx: PlatformContext, input: GymFormValues): Promise<Gym> {
    try {
      const row = await ctx.db.$transaction((tx) =>
        gymService.createWithin(tx, input)
      );
      return toDto(row, false);
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
    const locked = (await lockedGymIds(ctx.db, [id])).has(id);
    if (locked && input.country !== existing.country) {
      throw new ValidationError(
        'The country cannot be changed once the gym has prices or payments.'
      );
    }
    try {
      const row = await ctx.db.gym.update({
        where: { id },
        data: toData(input),
        include: withAdmins,
      });
      return toDto(row, locked);
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
    return toDto(row, (await lockedGymIds(ctx.db, [id])).has(id));
  },
};
