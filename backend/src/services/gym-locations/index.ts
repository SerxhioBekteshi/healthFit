import type { GymLocation as LocationRow, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type { GymLocation } from '@gym/shared/types';
import type { GymLocationFormValues } from '@gym/shared/validation/gym-locations';

const toDto = (row: LocationRow): GymLocation => ({
  id: row.id,
  gymId: row.gymId,
  name: row.name,
  address: row.address,
  phone: row.phone,
  latitude: row.latitude,
  longitude: row.longitude,
  mapUrl: row.mapUrl,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const gymLocationService = {
  // Members only see the locations they can train at.
  async list(ctx: TenantContext): Promise<GymLocation[]> {
    const rows = await ctx.db.gymLocation.findMany({
      where: ctx.role === 'client' ? { isActive: true } : {},
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDto);
  },

  async create(
    ctx: TenantContext,
    input: GymLocationFormValues
  ): Promise<GymLocation> {
    const row = await ctx.db.gymLocation.create({
      data: { gymId: ctx.gymId, ...input },
    });
    return toDto(row);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: GymLocationFormValues
  ): Promise<GymLocation> {
    const result = await ctx.db.gymLocation.updateMany({
      where: { id },
      data: input,
    });
    if (result.count === 0) {
      throw new NotFoundError('Location not found.');
    }
    const row = await ctx.db.gymLocation.findFirstOrThrow({ where: { id } });
    return toDto(row);
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean
  ): Promise<GymLocation> {
    const existing = await ctx.db.gymLocation.findFirst({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Location not found.');
    }
    if (!isActive && existing.isActive) {
      const activeCount = await ctx.db.gymLocation.count({
        where: { isActive: true },
      });
      if (activeCount <= 1) {
        throw new ValidationError('At least one location must stay active.');
      }
    }
    const row = await ctx.db.gymLocation.update({
      where: { id },
      data: { isActive },
    });
    return toDto(row);
  },

  // The location a check-in belongs to. A gym with one active location needs no choice; with
  // several the member picks one. A gym without any (legacy data) records none.
  async resolveForCheckIn(
    ctx: TenantContext,
    requestedId?: string
  ): Promise<LocationRow | null> {
    const active = await ctx.db.gymLocation.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    if (requestedId) {
      const chosen = active.find((location) => location.id === requestedId);
      if (!chosen) {
        throw new ValidationError('Choose one of the gym locations.');
      }
      return chosen;
    }
    if (active.length > 1) {
      throw new ValidationError('Choose the gym location for this check-in.');
    }
    return active[0] ?? null;
  },

  // Called when a gym is created so check-in works from the first day.
  async createDefault(
    db: Pick<Prisma.TransactionClient, 'gymLocation'>,
    gym: { id: string; address: string; location: string; contactPhone: string }
  ): Promise<void> {
    await db.gymLocation.create({
      data: {
        gymId: gym.id,
        name: 'Main',
        address: gym.address || gym.location,
        phone: gym.contactPhone,
      },
    });
  },
};
