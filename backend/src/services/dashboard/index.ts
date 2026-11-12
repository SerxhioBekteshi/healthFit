import { Prisma } from '@prisma/client';
import { attendanceService } from '@/services/attendance';
import { effectiveSubscriptionStatus } from '@/services/gym-subscriptions';
import { ledger } from '@/services/ledger';
import { membershipService } from '@/services/memberships';
import { NotFoundError } from '@/errors';
import type { PlatformContext, TenantContext } from '@/tenant/context';
import {
  addDays,
  formatDateOnly,
  localParts,
  parseDateOnly,
  startOfLocalDay,
  todayUtc,
} from '@/utils/dates';
import type {
  ClientDashboard,
  GymDashboard,
  PlatformDashboard,
} from '@gym/shared/types';

const LOW_STOCK_THRESHOLD = 5;
const EXPIRING_SOON_DAYS = 7;

const sum = (value: Prisma.Decimal | null | undefined): number =>
  (value ?? new Prisma.Decimal(0)).toNumber();

export const dashboardService = {
  async forGym(ctx: TenantContext): Promise<GymDashboard> {
    const gym = await ctx.db.gym.findFirst({ where: { id: ctx.gymId } });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }
    const today = todayUtc();
    const monthStart = startOfLocalDay(
      `${localParts(new Date(), gym.timezone).date.slice(0, 7)}-01`,
      gym.timezone
    );

    const [
      totalClients,
      activeClients,
      activeMemberships,
      expiringSoon,
      pendingPayments,
      lowStockProducts,
      membershipRevenue,
      productRevenue,
      attendance,
    ] = await Promise.all([
      ctx.db.client.count(),
      ctx.db.client.count({ where: { isActive: true } }),
      ctx.db.membership.count({
        where: {
          status: 'active',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      ctx.db.membership.count({
        where: {
          status: 'active',
          endDate: {
            gte: today,
            lte: addDays(today, EXPIRING_SOON_DAYS),
          },
          // A client who already queued the next membership is not about to lapse.
          client: {
            memberships: {
              none: { status: 'active', startDate: { gt: today } },
            },
          },
        },
      }),
      ctx.db.membership.count({ where: { paymentStatus: 'pending' } }),
      ctx.db.product.count({
        where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      }),
      ctx.db.membership.aggregate({
        where: { paymentStatus: 'paid', createdAt: { gte: monthStart } },
        _sum: { price: true },
      }),
      ctx.db.productSale.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { total: true },
      }),
      attendanceService.stats(ctx),
    ]);

    // Distinct members per gym-local day for the last 7 days, today last.
    const localToday = localParts(new Date(), gym.timezone).date;
    const days = Array.from({ length: 7 }, (_, index) =>
      formatDateOnly(addDays(parseDateOnly(localToday), index - 6))
    );
    const [visitRows, expiringRows, recentRows] = await Promise.all([
      ctx.db.attendance.findMany({
        where: { checkedInAt: { gte: startOfLocalDay(days[0], gym.timezone) } },
        select: { clientId: true, checkedInAt: true },
      }),
      ctx.db.membership.findMany({
        where: {
          status: 'active',
          endDate: { gte: today, lte: addDays(today, EXPIRING_SOON_DAYS) },
          client: {
            memberships: {
              none: { status: 'active', startDate: { gt: today } },
            },
          },
        },
        include: { client: { select: { fullName: true } } },
        orderBy: { endDate: 'asc' },
        take: 5,
      }),
      ctx.db.attendance.findMany({
        include: { client: { select: { fullName: true } } },
        orderBy: { checkedInAt: 'desc' },
        take: 6,
      }),
    ]);
    const visitors = new Map<string, Set<string>>(
      days.map((day) => [day, new Set<string>()])
    );
    for (const row of visitRows) {
      visitors
        .get(localParts(row.checkedInAt, gym.timezone).date)
        ?.add(row.clientId);
    }

    return {
      gymName: gym.name,
      totalClients,
      activeClients,
      activeMemberships,
      expiringSoon,
      pendingPayments,
      lowStockProducts,
      revenueThisMonth:
        sum(membershipRevenue._sum.price) + sum(productRevenue._sum.total),
      attendance,
      visitsByDay: days.map((date) => ({
        date,
        count: visitors.get(date)?.size ?? 0,
      })),
      expiringMemberships: expiringRows.map((row) => ({
        clientName: row.client.fullName,
        planName: row.planName,
        endDate: formatDateOnly(row.endDate),
      })),
      recentCheckIns: recentRows.map((row) => ({
        clientName: row.client.fullName,
        checkedInAt: row.checkedInAt.toISOString(),
      })),
    };
  },

  async forClient(ctx: TenantContext): Promise<ClientDashboard> {
    const clientId = ctx.clientId ?? '';
    const client = await ctx.db.client.findFirst({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundError('Client profile not found.');
    }
    const gym = await ctx.db.gym.findFirst({ where: { id: ctx.gymId } });
    const localToday = localParts(new Date(), gym?.timezone ?? 'UTC').date;

    const [active, balance, myAttendance, currentlyInside, week] =
      await Promise.all([
        membershipService.findActiveForClient(
          ctx.db,
          clientId,
          new Date(`${localToday}T00:00:00.000Z`)
        ),
        ledger.balance(ctx.db, clientId),
        attendanceService.myStats(ctx),
        attendanceService.occupancy(ctx),
        attendanceService.myWeek(ctx),
      ]);

    const { visitsAllowed, visitsUsed, visitsEndDate } =
      active && active.weeklyVisits > 0
        ? await attendanceService.periodVisits(ctx, active)
        : {
            visitsAllowed: 0,
            visitsUsed: 0,
            visitsEndDate: active ? formatDateOnly(active.endDate) : '',
          };

    return {
      clientId,
      fullName: client.fullName,
      activeMembership: active
        ? {
            planName: active.planName,
            planType: active.planType,
            endDate: formatDateOnly(active.endDate),
            visitsRemaining: active.visitsRemaining,
            weeklyVisits: active.weeklyVisits,
            price: active.price.toNumber(),
            visitsAllowed,
            visitsUsed,
            visitsEndDate,
          }
        : null,
      balance: balance.toNumber(),
      attendance: myAttendance,
      week,
      currentlyInside,
    };
  },

  async forPlatform(ctx: PlatformContext): Promise<PlatformDashboard> {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      activeGyms,
      inactiveGyms,
      totalClients,
      activeMemberships,
      checkInsLast24h,
      totalPrograms,
      subscriptions,
      revenueTotal,
      revenueThisMonth,
    ] = await Promise.all([
      ctx.db.gym.count({ where: { isActive: true } }),
      ctx.db.gym.count({ where: { isActive: false } }),
      ctx.db.client.count(),
      ctx.db.membership.count({
        where: {
          status: 'active',
          startDate: { lte: todayUtc() },
          endDate: { gte: todayUtc() },
        },
      }),
      ctx.db.attendance.count({ where: { checkedInAt: { gte: dayAgo } } }),
      ctx.db.workoutProgram.count(),
      ctx.db.gymSubscription.findMany(),
      ctx.db.gymSubscriptionPayment.aggregate({ _sum: { amount: true } }),
      ctx.db.gymSubscriptionPayment.aggregate({
        where: { paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    const counts = { trialing: 0, active: 0, past_due: 0, cancelled: 0 };
    let overdueAmount = new Prisma.Decimal(0);
    for (const subscription of subscriptions) {
      const status = effectiveSubscriptionStatus(subscription);
      counts[status] += 1;
      if (status === 'past_due') {
        overdueAmount = overdueAmount.plus(subscription.price);
      }
    }

    return {
      totalGyms: activeGyms + inactiveGyms,
      activeGyms,
      inactiveGyms,
      totalClients,
      activeMemberships,
      checkInsLast24h,
      totalPrograms,
      subscriptions: {
        trialing: counts.trialing,
        active: counts.active,
        pastDue: counts.past_due,
        cancelled: counts.cancelled,
      },
      revenueTotal: sum(revenueTotal._sum.amount),
      revenueThisMonth: sum(revenueThisMonth._sum.amount),
      overdueAmount: overdueAmount.toNumber(),
    };
  },
};
