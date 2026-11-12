import type { StaffMember as StaffRow } from '@prisma/client';
import { NotFoundError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type { StaffMember } from '@gym/shared/types';
import type { StaffMemberFormValues } from '@gym/shared/validation/staff-members';

const toDto = (row: StaffRow): StaffMember => ({
  id: row.id,
  gymId: row.gymId,
  fullName: row.fullName,
  specialty: row.specialty,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const requireStaffMember = async (
  ctx: TenantContext,
  id: string
): Promise<StaffRow> => {
  const row = await ctx.db.staffMember.findFirst({ where: { id } });
  if (!row) {
    throw new NotFoundError('Staff member not found.');
  }
  return row;
};

export const staffMemberService = {
  async list(ctx: TenantContext): Promise<StaffMember[]> {
    const rows = await ctx.db.staffMember.findMany({
      orderBy: { fullName: 'asc' },
    });
    return rows.map(toDto);
  },

  async create(
    ctx: TenantContext,
    input: StaffMemberFormValues
  ): Promise<StaffMember> {
    const row = await ctx.db.staffMember.create({
      data: { gymId: ctx.gymId, ...input },
    });
    return toDto(row);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: StaffMemberFormValues
  ): Promise<StaffMember> {
    await requireStaffMember(ctx, id);
    await ctx.db.staffMember.updateMany({ where: { id }, data: input });
    return toDto(await requireStaffMember(ctx, id));
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean
  ): Promise<StaffMember> {
    await requireStaffMember(ctx, id);
    await ctx.db.staffMember.updateMany({ where: { id }, data: { isActive } });
    return toDto(await requireStaffMember(ctx, id));
  },
};
