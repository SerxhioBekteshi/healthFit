import type { GymClosure as ClosureRow } from '@prisma/client';
import { NotFoundError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import { formatDateOnly, parseDateOnly } from '@/utils/dates';
import type { GymClosure } from '@gym/shared/types';
import type { GymClosureFormValues } from '@gym/shared/validation/gym-closures';

const toDto = (row: ClosureRow): GymClosure => ({
  id: row.id,
  gymId: row.gymId,
  startDate: formatDateOnly(row.startDate),
  endDate: formatDateOnly(row.endDate),
  reason: row.reason,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toData = (input: GymClosureFormValues) => ({
  startDate: parseDateOnly(input.startDate),
  endDate: parseDateOnly(input.endDate),
  reason: input.reason,
});

export const gymClosureService = {
  async list(ctx: TenantContext): Promise<GymClosure[]> {
    const rows = await ctx.db.gymClosure.findMany({
      orderBy: { startDate: 'desc' },
    });
    return rows.map(toDto);
  },

  async create(
    ctx: TenantContext,
    input: GymClosureFormValues
  ): Promise<GymClosure> {
    const row = await ctx.db.gymClosure.create({
      data: { gymId: ctx.gymId, ...toData(input) },
    });
    return toDto(row);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: GymClosureFormValues
  ): Promise<GymClosure> {
    const result = await ctx.db.gymClosure.updateMany({
      where: { id },
      data: toData(input),
    });
    if (result.count === 0) {
      throw new NotFoundError('Closure not found.');
    }
    const row = await ctx.db.gymClosure.findFirstOrThrow({ where: { id } });
    return toDto(row);
  },

  async remove(ctx: TenantContext, id: string): Promise<void> {
    const result = await ctx.db.gymClosure.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundError('Closure not found.');
    }
  },

  // Closure covering the given gym-local calendar date, if any.
  findCovering(
    db: Pick<TenantContext['db'], 'gymClosure'>,
    localDate: string
  ): Promise<ClosureRow | null> {
    const day = parseDateOnly(localDate);
    return db.gymClosure.findFirst({
      where: { startDate: { lte: day }, endDate: { gte: day } },
    });
  },
};
