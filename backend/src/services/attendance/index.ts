import type { Attendance as AttendanceRow } from '@prisma/client';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';
import { gymClosureService } from '@/services/gym-closures';
import { gymLocationService } from '@/services/gym-locations';
import { membershipService } from '@/services/memberships';
import type { TenantContext } from '@/tenant/context';
import {
  addDays,
  formatDateOnly,
  localParts,
  parseDateOnly,
  startOfLocalDay,
  startOfWeekDate,
} from '@/utils/dates';
import { retryOnConflict } from '@/utils/transactions';
import type {
  AttendanceHistoryPage,
  AttendanceRecord,
  ClientWeek,
} from '@gym/shared/types';

// Members do not always check out, so open check-ins older than this no longer count as inside.
const OCCUPANCY_WINDOW_MS = 3 * 60 * 60 * 1000;
const RECENT_LIMIT = 100;
const HISTORY_PAGE_SIZE = 20;
const HISTORY_MAX_PAGE_SIZE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 28;
// Ignores a repeated scan of the same code right after a check-in.
const DUPLICATE_SCAN_MS = 60 * 1000;

type AttendanceWithClient = AttendanceRow & {
  client: { fullName: string };
  location: { name: string } | null;
};

const withClientAndLocation = {
  client: { select: { fullName: true } },
  location: { select: { name: true } },
} as const;

const toDto = (row: AttendanceWithClient): AttendanceRecord => ({
  id: row.id,
  gymId: row.gymId,
  clientId: row.clientId,
  clientName: row.client.fullName,
  membershipId: row.membershipId,
  locationId: row.locationId,
  locationName: row.location?.name ?? null,
  checkedInAt: row.checkedInAt.toISOString(),
  checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
});

const requireGym = async (ctx: TenantContext) => {
  const gym = await ctx.db.gym.findFirst({ where: { id: ctx.gymId } });
  if (!gym) {
    throw new NotFoundError('Gym not found.');
  }
  return gym;
};

// Several entries on one local day are a single visit.
const countVisitDays = (
  rows: { checkedInAt: Date }[],
  timeZone: string
): number =>
  new Set(rows.map((row) => localParts(row.checkedInAt, timeZone).date)).size;

export interface AttendanceStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  currentlyInside: number;
}

export const attendanceService = {
  async list(
    ctx: TenantContext,
    limit: number = RECENT_LIMIT
  ): Promise<AttendanceRecord[]> {
    const rows = await ctx.db.attendance.findMany({
      // Clients only ever see their own history.
      where: ctx.role === 'client' ? { clientId: ctx.clientId ?? '' } : {},
      include: withClientAndLocation,
      orderBy: { checkedInAt: 'desc' },
      take: Math.min(Math.max(limit, 1), RECENT_LIMIT),
    });
    return rows.map(toDto);
  },

  async history(
    ctx: TenantContext,
    page: { cursor?: string; limit?: number } = {}
  ): Promise<AttendanceHistoryPage> {
    const take = Math.min(
      Math.max(page.limit ?? HISTORY_PAGE_SIZE, 1),
      HISTORY_MAX_PAGE_SIZE
    );
    const rows = await ctx.db.attendance.findMany({
      // Clients only ever see their own history.
      where: ctx.role === 'client' ? { clientId: ctx.clientId ?? '' } : {},
      include: withClientAndLocation,
      orderBy: [{ checkedInAt: 'desc' }, { id: 'desc' }],
      // One extra row tells whether another page exists.
      take: take + 1,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    });
    const items = rows.slice(0, take);
    return {
      records: items.map(toDto),
      nextCursor: rows.length > take ? items[items.length - 1].id : null,
    };
  },

  async checkIn(
    ctx: TenantContext,
    requestedClientId: string,
    now: Date = new Date(),
    requestedLocationId?: string
  ): Promise<AttendanceRecord> {
    const clientId = ctx.role === 'client' ? ctx.clientId : requestedClientId;
    if (!clientId) {
      throw new ForbiddenError();
    }

    const client = await ctx.db.client.findFirst({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundError('No client found for that code in this gym.');
    }
    if (!client.isActive) {
      throw new ValidationError('This client account is not active.');
    }

    const gym = await requireGym(ctx);
    const location = await gymLocationService.resolveForCheckIn(
      ctx,
      requestedLocationId
    );
    const local = localParts(now, gym.timezone);
    if (local.time < gym.opensAt || local.time >= gym.closesAt) {
      throw new ValidationError(
        `The gym is closed right now (open ${gym.opensAt}-${gym.closesAt}).`
      );
    }

    const closure = await gymClosureService.findCovering(ctx.db, local.date);
    if (closure) {
      throw new ValidationError(
        `The gym is closed today${closure.reason ? `: ${closure.reason}` : '.'}`
      );
    }

    const membership = await membershipService.findActiveForClient(
      ctx.db,
      clientId,
      parseDateOnly(local.date)
    );
    if (!membership) {
      throw new ValidationError(
        'No active membership found. Please renew before checking in.'
      );
    }

    const row = await retryOnConflict(() =>
      ctx.db.$transaction(
        async (tx) => {
          // A member can come and go all day; only the first entry of a local day is a visit.
          const lastToday = await tx.attendance.findFirst({
            where: {
              clientId,
              checkedInAt: { gte: startOfLocalDay(local.date, gym.timezone) },
            },
            orderBy: { checkedInAt: 'desc' },
          });
          if (
            lastToday &&
            Math.abs(now.getTime() - lastToday.checkedInAt.getTime()) <
              DUPLICATE_SCAN_MS
          ) {
            throw new ValidationError('This client just checked in.');
          }
          const isNewVisit = !lastToday;

          if (isNewVisit && membership.weeklyVisits > 0) {
            const thisWeek = await tx.attendance.findMany({
              where: {
                clientId,
                checkedInAt: {
                  gte: startOfLocalDay(
                    startOfWeekDate(local.date),
                    gym.timezone
                  ),
                },
              },
              select: { checkedInAt: true },
            });
            if (
              countVisitDays(thisWeek, gym.timezone) >= membership.weeklyVisits
            ) {
              throw new ValidationError(
                `Weekly limit reached: this plan allows ${membership.weeklyVisits} visits per week.`
              );
            }
          }

          if (isNewVisit && membership.planType === 'visit_based') {
            const used = await tx.membership.updateMany({
              where: { id: membership.id, visitsRemaining: { gt: 0 } },
              data: { visitsRemaining: { decrement: 1 } },
            });
            if (used.count === 0) {
              throw new ValidationError(
                'No visits remaining on this membership.'
              );
            }
          }

          return tx.attendance.create({
            data: {
              gymId: ctx.gymId,
              clientId,
              membershipId: membership.id,
              locationId: location?.id ?? null,
              checkedInAt: now,
            },
            include: withClientAndLocation,
          });
        },
        { isolationLevel: 'Serializable' }
      )
    );
    return toDto(row);
  },

  async stats(
    ctx: TenantContext,
    now: Date = new Date()
  ): Promise<AttendanceStats> {
    const gym = await requireGym(ctx);
    const { date } = localParts(now, gym.timezone);
    const since = (localDate: string) => ({
      gte: startOfLocalDay(localDate, gym.timezone),
    });

    const [today, thisWeek, thisMonth, currentlyInside] = await Promise.all([
      ctx.db.attendance.count({ where: { checkedInAt: since(date) } }),
      ctx.db.attendance.count({
        where: { checkedInAt: since(startOfWeekDate(date)) },
      }),
      ctx.db.attendance.count({
        where: { checkedInAt: since(`${date.slice(0, 7)}-01`) },
      }),
      attendanceService.occupancy(ctx, now),
    ]);

    return { today, thisWeek, thisMonth, currentlyInside };
  },

  // People who checked in recently and have not checked out.
  occupancy(ctx: TenantContext, now: Date = new Date()): Promise<number> {
    return ctx.db.attendance.count({
      where: {
        checkedOutAt: null,
        checkedInAt: { gte: new Date(now.getTime() - OCCUPANCY_WINDOW_MS) },
      },
    });
  },

  // Visits in the 4-week period of the membership that contains today; 4x per week is 16.
  // Days left over after the last full 4 weeks (29th to 31st) add no visits.
  async periodVisits(
    ctx: TenantContext,
    membership: {
      id: string;
      weeklyVisits: number;
      startDate: Date;
      endDate: Date;
    },
    now: Date = new Date()
  ): Promise<{
    visitsAllowed: number;
    visitsUsed: number;
    visitsEndDate: string;
  }> {
    const gym = await requireGym(ctx);
    const dayDiff = (from: Date, to: Date) =>
      Math.round((to.getTime() - from.getTime()) / DAY_MS);

    const lastIndex = Math.max(
      0,
      Math.floor(
        dayDiff(membership.startDate, membership.endDate) / PERIOD_DAYS
      ) - 1
    );
    const today = parseDateOnly(localParts(now, gym.timezone).date);
    const index = Math.min(
      Math.max(
        Math.floor(dayDiff(membership.startDate, today) / PERIOD_DAYS),
        0
      ),
      lastIndex
    );
    const from = addDays(membership.startDate, index * PERIOD_DAYS);
    // The last period runs through the final day of the membership.
    const to =
      index === lastIndex
        ? addDays(membership.endDate, 1)
        : addDays(from, PERIOD_DAYS);

    const periodRows = await ctx.db.attendance.findMany({
      where: {
        membershipId: membership.id,
        checkedInAt: {
          gte: startOfLocalDay(formatDateOnly(from), gym.timezone),
          lt: startOfLocalDay(formatDateOnly(to), gym.timezone),
        },
      },
      select: { checkedInAt: true },
    });
    const visitsUsed = countVisitDays(periodRows, gym.timezone);
    const visitsAllowed = Math.round(
      (membership.weeklyVisits * Math.min(dayDiff(from, to), PERIOD_DAYS)) / 7
    );
    return {
      visitsAllowed,
      visitsUsed,
      // End of the last full 4 weeks; the leftover days are not counted.
      visitsEndDate: formatDateOnly(
        new Date(
          Math.min(
            membership.endDate.getTime(),
            addDays(
              membership.startDate,
              (lastIndex + 1) * PERIOD_DAYS
            ).getTime()
          )
        )
      ),
    };
  },

  // Days of the current Monday-based week on which the signed-in client checked in.
  async myWeek(
    ctx: TenantContext,
    now: Date = new Date()
  ): Promise<ClientWeek> {
    const gym = await requireGym(ctx);
    const today = localParts(now, gym.timezone).date;
    const start = startOfWeekDate(today);
    const previousStart = formatDateOnly(addDays(parseDateOnly(start), -7));
    const rows = await ctx.db.attendance.findMany({
      where: {
        clientId: ctx.clientId ?? '',
        checkedInAt: { gte: startOfLocalDay(previousStart, gym.timezone) },
      },
      select: { checkedInAt: true },
    });
    const dates = [
      ...new Set(
        rows.map((row) => localParts(row.checkedInAt, gym.timezone).date)
      ),
    ].sort();
    return {
      start,
      today,
      checkedInDates: dates.filter((date) => date >= start),
      previousVisits: dates.filter((date) => date < start).length,
    };
  },

  // The signed-in client's own visit counts.
  async myStats(
    ctx: TenantContext,
    now: Date = new Date()
  ): Promise<{ total: number; last7Days: number; last30Days: number }> {
    const clientId = ctx.clientId ?? '';
    const since = (days: number) => ({
      gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
    });
    const [total, last7Days, last30Days] = await Promise.all([
      ctx.db.attendance.count({ where: { clientId } }),
      ctx.db.attendance.count({ where: { clientId, checkedInAt: since(7) } }),
      ctx.db.attendance.count({ where: { clientId, checkedInAt: since(30) } }),
    ]);
    return { total, last7Days, last30Days };
  },
};
