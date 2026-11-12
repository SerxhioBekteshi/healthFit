import type {
  GymClass as ClassRow,
  Prisma,
  StaffMember as StaffRow,
} from '@prisma/client';
import { NotFoundError, ValidationError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type { GymClass } from '@gym/shared/types';
import type { ClassFormValues } from '@gym/shared/validation/classes';
import { DEFAULT_CLASSES } from './defaults';

type ClassWithStaff = ClassRow & { staffMember: StaffRow | null };

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const toDto = (row: ClassWithStaff): GymClass => ({
  id: row.id,
  gymId: row.gymId,
  name: row.name,
  description: row.description,
  weekdays: row.weekdays,
  startTime: row.startTime,
  endTime: row.endTime,
  staffMemberId: row.staffMemberId,
  staffMemberName: row.staffMember?.fullName ?? null,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const withStaff = { staffMember: true } as const;

const requireClass = async (
  ctx: TenantContext,
  id: string
): Promise<ClassWithStaff> => {
  const row = await ctx.db.gymClass.findFirst({
    where: { id },
    include: withStaff,
  });
  if (!row) {
    throw new NotFoundError('Class not found.');
  }
  return row;
};

// One instructor cannot teach two classes that overlap on the same weekday.
const assertInstructorFree = async (
  ctx: TenantContext,
  staff: StaffRow,
  input: { weekdays: number[]; startTime: string; endTime: string },
  ignoreId?: string
): Promise<void> => {
  const clash = await ctx.db.gymClass.findFirst({
    where: {
      staffMemberId: staff.id,
      isActive: true,
      id: ignoreId ? { not: ignoreId } : undefined,
      weekdays: { hasSome: input.weekdays },
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
  });
  if (clash) {
    const day = clash.weekdays.find((weekday) =>
      input.weekdays.includes(weekday)
    );
    throw new ValidationError(
      `${staff.fullName} already teaches ${clash.name} (${clash.startTime}-${clash.endTime}) on ${DAY_NAMES[(day ?? 1) - 1]}.`
    );
  }
};

const prepare = async (
  ctx: TenantContext,
  input: ClassFormValues,
  current?: ClassRow
) => {
  const weekdays = [...new Set(input.weekdays)].sort();
  let staffMemberId: string | null = null;
  if (input.staffMemberId) {
    // A class may keep an instructor that was deactivated since.
    const keepsCurrent = current?.staffMemberId === input.staffMemberId;
    const staff = await ctx.db.staffMember.findFirst({
      where: {
        id: input.staffMemberId,
        ...(keepsCurrent ? {} : { isActive: true }),
      },
    });
    if (!staff) {
      throw new NotFoundError('Staff member not found or inactive.');
    }
    await assertInstructorFree(ctx, staff, { ...input, weekdays }, current?.id);
    staffMemberId = staff.id;
  }
  return {
    name: input.name,
    description: input.description,
    weekdays,
    startTime: input.startTime,
    endTime: input.endTime,
    staffMemberId,
  };
};

export const classService = {
  // Called when a gym is created so its timetable is not empty.
  async createDefaults(
    db: Pick<Prisma.TransactionClient, 'gymClass'>,
    gymId: string
  ): Promise<void> {
    await db.gymClass.createMany({
      data: DEFAULT_CLASSES.map((item) => ({ gymId, ...item })),
    });
  },

  async list(ctx: TenantContext): Promise<GymClass[]> {
    const rows = await ctx.db.gymClass.findMany({
      // Members only see what is on the timetable.
      where: ctx.role === 'client' ? { isActive: true } : {},
      include: withStaff,
      orderBy: [{ startTime: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toDto);
  },

  async create(ctx: TenantContext, input: ClassFormValues): Promise<GymClass> {
    const data = await prepare(ctx, input);
    const row = await ctx.db.gymClass.create({
      data: { gymId: ctx.gymId, ...data },
      include: withStaff,
    });
    return toDto(row);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: ClassFormValues
  ): Promise<GymClass> {
    const current = await requireClass(ctx, id);
    const data = await prepare(ctx, input, current);
    await ctx.db.gymClass.updateMany({ where: { id }, data });
    return toDto(await requireClass(ctx, id));
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean
  ): Promise<GymClass> {
    const current = await requireClass(ctx, id);
    if (isActive && current.staffMember) {
      await assertInstructorFree(ctx, current.staffMember, current, id);
    }
    await ctx.db.gymClass.updateMany({ where: { id }, data: { isActive } });
    return toDto(await requireClass(ctx, id));
  },

  async remove(ctx: TenantContext, id: string): Promise<void> {
    const result = await ctx.db.gymClass.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundError('Class not found.');
    }
  },
};
