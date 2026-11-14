import { Prisma } from '@prisma/client';
import { attendanceService } from '@/services/attendance';
import { openVisitWhere } from '@/services/attendance/open';
import { effectiveSubscriptionStatus } from '@/services/gym-subscriptions';
import { ledger } from '@/services/ledger';
import { memberCardService } from '@/services/member-cards';
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
  CurrencyCode,
  GymDashboard,
  MoneyTotal,
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

    const [active, balance, myAttendance, currentlyInside, week, card, visit] =
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
        gym?.cardsEnabled
          ? memberCardService.activeNumber(ctx.db, clientId)
          : null,
        ctx.db.attendance.findFirst({
          where: openVisitWhere(clientId, new Date()),
          include: {
            locker: {
              select: { number: true, location: { select: { name: true } } },
            },
          },
          orderBy: { checkedInAt: 'desc' },
        }),
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
      card,
      checkedIn: visit !== null,
      locker: visit?.locker
        ? {
            lockerNumber: visit.locker.number,
            locationName: visit.locker.location.name,
            clientName: client.fullName,
          }
        : null,
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
      gymCurrencies,
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
      ctx.db.gym.findMany({ select: { id: true, currency: true } }),
      ctx.db.gymSubscriptionPayment.groupBy({
        by: ['gymId'],
        _sum: { amount: true },
      }),
      ctx.db.gymSubscriptionPayment.groupBy({
        by: ['gymId'],
        where: { paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    // Gyms use different currencies, so money is added up per currency and never mixed.
    const currencyOf = new Map(
      gymCurrencies.map((gym) => [gym.id, gym.currency])
    );
    const totalsByCurrency = (
      rows: { gymId: string; amount: Prisma.Decimal | null }[]
    ): MoneyTotal[] => {
      const totals = new Map<CurrencyCode, number>();
      for (const row of rows) {
        const currency = currencyOf.get(row.gymId);
        if (currency) {
          totals.set(currency, (totals.get(currency) ?? 0) + sum(row.amount));
        }
      }
      return [...totals]
        .filter(([, amount]) => amount > 0)
        .map(([currency, amount]) => ({ currency, amount }))
        .sort((a, b) => b.amount - a.amount);
    };

    const counts = { trialing: 0, active: 0, past_due: 0, cancelled: 0 };
    const overdueRows: { gymId: string; amount: Prisma.Decimal }[] = [];
    for (const subscription of subscriptions) {
      const status = effectiveSubscriptionStatus(subscription);
      counts[status] += 1;
      if (status === 'past_due') {
        overdueRows.push({
          gymId: subscription.gymId,
          amount: subscription.price,
        });
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
      revenueTotal: totalsByCurrency(
        revenueTotal.map((row) => ({
          gymId: row.gymId,
          amount: row._sum.amount,
        }))
      ),
      revenueThisMonth: totalsByCurrency(
        revenueThisMonth.map((row) => ({
          gymId: row.gymId,
          amount: row._sum.amount,
        }))
      ),
      overdueAmount: totalsByCurrency(overdueRows),
    };
  },
};
