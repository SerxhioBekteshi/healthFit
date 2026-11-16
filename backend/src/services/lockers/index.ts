import type {
  Locker as LockerRow,
  GymLocation as LocationRow,
} from '@prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/errors';
import { accessSettingsService } from '@/services/access-settings';
import { openVisitSince, openVisitWhere } from '@/services/attendance/open';
import { genderSettingsService } from '@/services/gender-settings';
import { memberCardService } from '@/services/member-cards';
import type { TenantContext } from '@/tenant/context';
import { retryOnConflict } from '@/utils/transactions';
import type { Gender, Locker, LockerAssignment } from '@gym/shared/types';
import type {
  AssignLockerValues,
  LockerRangeValues,
  ReleaseLockerValues,
} from '@gym/shared/validation/lockers';

type LockerWithState = LockerRow & {
  location: Pick<LocationRow, 'name'>;
  attendances: {
    checkedInAt: Date;
    client: { id: string; fullName: string };
  }[];
};

// Lockers are labelled in upper case ("M12"), so what staff type always matches.
const normalizeNumber = (value: string): string => value.trim().toUpperCase();

const otherGender = (gender: Gender): Gender =>
  gender === 'male' ? 'female' : 'male';

const withState = (now: Date) =>
  ({
    location: { select: { name: true } },
    // A locker is taken while a visit that holds it is still open.
    attendances: {
      where: { checkedOutAt: null, checkedInAt: { gte: openVisitSince(now) } },
      select: {
        checkedInAt: true,
        client: { select: { id: true, fullName: true } },
      },
      orderBy: { checkedInAt: 'desc' },
      take: 1,
    },
  }) as const;

const toDto = (row: LockerWithState): Locker => {
  const holder = row.attendances[0];
  return {
    id: row.id,
    locationId: row.locationId,
    locationName: row.location.name,
    gender: row.gender,
    number: row.number,
    isActive: row.isActive,
    occupiedBy: holder
      ? {
          clientId: holder.client.id,
          clientName: holder.client.fullName,
          since: holder.checkedInAt.toISOString(),
        }
      : null,
  };
};

const byPlace = (a: Locker, b: Locker): number =>
  a.locationName.localeCompare(b.locationName) ||
  a.gender.localeCompare(b.gender) ||
  a.number.localeCompare(b.number, undefined, { numeric: true });

// Who the request is about: a member for themselves, or staff naming a member by card or code.
const resolveMember = async (
  ctx: TenantContext,
  code: string | undefined,
  options: { cardOnly: boolean }
): Promise<{ id: string; fullName: string; gender: Gender | null }> => {
  const settings = await accessSettingsService.get(ctx);
  if (ctx.role === 'client') {
    if (settings.lockersUseCard || !ctx.clientId) {
      throw new ForbiddenError(
        'Lockers here are locked with your card. Tap it at the locker.'
      );
    }
    const own = await ctx.db.client.findFirst({ where: { id: ctx.clientId } });
    if (!own) {
      throw new NotFoundError('Client profile not found.');
    }
    return own;
  }
  if (!code) {
    throw new ValidationError('Enter the member code or card number.');
  }
  const { client, viaCard } = await memberCardService.resolveClient(ctx, code);
  if (options.cardOnly && settings.lockersUseCard && !viaCard) {
    throw new ValidationError(
      'Lockers here are locked with a card: scan the member card.'
    );
  }
  return client;
};

export const lockerService = {
  async list(
    ctx: TenantContext,
    locationId?: string,
    now: Date = new Date()
  ): Promise<Locker[]> {
    const rows = await ctx.db.locker.findMany({
      where: locationId ? { locationId } : {},
      include: withState(now),
    });
    return rows.map(toDto).sort(byPlace);
  },

  // Adds the numbers from..to (with an optional prefix) to one location and gender; existing
  // ones are kept. Mirrors the same range to the other gender when the gym configures them alike.
  async createRange(
    ctx: TenantContext,
    input: LockerRangeValues
  ): Promise<Locker[]> {
    const location = await ctx.db.gymLocation.findFirst({
      where: { id: input.locationId },
    });
    if (!location) {
      throw new NotFoundError('Gym location not found.');
    }
    const mirror = await genderSettingsService.isSameLockersForBothGenders(ctx);
    const prefix = input.prefix.trim().toUpperCase();
    const numbers = Array.from(
      { length: input.to - input.from + 1 },
      (_, index) => `${prefix}${input.from + index}`
    );
    const genders = mirror
      ? [input.gender, otherGender(input.gender)]
      : [input.gender];
    for (const gender of genders) {
      await ctx.db.locker.createMany({
        data: numbers.map((number) => ({
          gymId: ctx.gymId,
          locationId: location.id,
          gender,
          number,
        })),
        skipDuplicates: true,
      });
    }
    return lockerService.list(ctx, location.id);
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean,
    now: Date = new Date()
  ): Promise<Locker> {
    const result = await ctx.db.locker.updateMany({
      where: { id },
      data: { isActive },
    });
    if (result.count === 0) {
      throw new NotFoundError('Locker not found.');
    }
    const row = await ctx.db.locker.findFirstOrThrow({
      where: { id },
      include: withState(now),
    });
    return toDto(row);
  },

  async remove(
    ctx: TenantContext,
    id: string,
    now: Date = new Date()
  ): Promise<void> {
    const row = await ctx.db.locker.findFirst({
      where: { id },
      include: withState(now),
    });
    if (!row) {
      throw new NotFoundError('Locker not found.');
    }
    if (row.attendances.length > 0) {
      throw new ConflictError('A locker in use cannot be removed.');
    }
    await ctx.db.locker.deleteMany({ where: { id } });
  },

  // Puts the member's things in a locker for the visit they are on; a different one replaces it.
  async assign(
    ctx: TenantContext,
    input: AssignLockerValues,
    now: Date = new Date()
  ): Promise<LockerAssignment> {
    const client = await resolveMember(ctx, input.code, { cardOnly: true });
    const visit = await ctx.db.attendance.findFirst({
      where: openVisitWhere(client.id, now),
      orderBy: { checkedInAt: 'desc' },
    });
    if (!visit) {
      throw new ValidationError('The member is not checked in.');
    }

    const number = normalizeNumber(input.lockerNumber);
    const locker = await retryOnConflict(() =>
      ctx.db.$transaction(
        async (tx) => {
          const matches = await tx.locker.findMany({
            where: {
              number,
              ...(visit.locationId ? { locationId: visit.locationId } : {}),
            },
            include: { location: { select: { name: true } } },
          });
          // Men's and women's rooms can share a number; the member's own gender picks the room.
          const found =
            matches.length > 1
              ? (matches.find((item) => item.gender === client.gender) ?? null)
              : (matches[0] ?? null);
          if (!found) {
            if (matches.length > 1) {
              throw new ValidationError(
                "This gym has separate lockers for men and women; set this member's gender first."
              );
            }
            throw new NotFoundError('Locker not found.');
          }
          if (!found.isActive) {
            throw new ValidationError('This locker is out of service.');
          }
          const taken = await tx.attendance.findFirst({
            where: {
              lockerId: found.id,
              checkedOutAt: null,
              checkedInAt: { gte: openVisitSince(now) },
              id: { not: visit.id },
            },
          });
          if (taken) {
            throw new ConflictError('That locker is already in use.');
          }
          await tx.attendance.updateMany({
            where: { id: visit.id },
            data: { lockerId: found.id },
          });
          return found;
        },
        { isolationLevel: 'Serializable' }
      )
    );
    return {
      lockerNumber: locker.number,
      locationName: locker.location.name,
      clientName: client.fullName,
    };
  },

  // Frees the member's locker before they check out, for example when they swap or leave early.
  async release(
    ctx: TenantContext,
    input: ReleaseLockerValues,
    now: Date = new Date()
  ): Promise<void> {
    const client = await resolveMember(ctx, input.code, { cardOnly: false });
    const visit = await ctx.db.attendance.findFirst({
      where: { ...openVisitWhere(client.id, now), lockerId: { not: null } },
      orderBy: { checkedInAt: 'desc' },
    });
    if (!visit) {
      throw new ValidationError('No locker is in use.');
    }
    await ctx.db.attendance.updateMany({
      where: { id: visit.id },
      data: { lockerId: null },
    });
  },
};
