import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { PlatformContext, TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { dashboardService } from '@/services/dashboard';
import { gymSubscriptionService } from '@/services/gym-subscriptions';
import { ConflictError, NotFoundError, ValidationError } from '@/errors';

const prisma = new PrismaClient();

const platform: PlatformContext = {
  user: {
    id: 'owner',
    email: 'owner@test.dev',
    name: 'Owner',
    role: 'super_admin',
    gymId: null,
  },
  db: prisma,
};

const isoDay = (offsetDays: number): string =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

const day = (offsetDays: number): Date =>
  new Date(`${isoDay(offsetDays)}T00:00:00.000Z`);

let gymAId: string;
let gymBId: string;

const tenantContext = (
  gymId: string,
  role: 'gym_admin' | 'client',
  clientId: string | null = null
): TenantContext => ({
  user: {
    id: `u-${gymId}`,
    email: 'u@test.dev',
    name: 'User',
    role,
    gymId,
  },
  role,
  gymId,
  clientId,
  db: createTenantDb(prisma, gymId),
});

const wipe = async (): Promise<void> => {
  await prisma.gymSubscriptionPayment.deleteMany();
  await prisma.gymSubscription.deleteMany();
  await prisma.productSale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.workoutProgram.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  gymAId = (await prisma.gym.create({ data: { name: 'Gym A' } })).id;
  gymBId = (
    await prisma.gym.create({ data: { name: 'Gym B', isActive: false } })
  ).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

const subscriptionInput = (gymId: string, startDate = isoDay(0)) => ({
  gymId,
  planName: 'Pro',
  cycle: 'monthly' as const,
  price: 99,
  startDate,
});

describe('gymSubscriptionService', () => {
  it('starts as a trial and allows one subscription per gym', async () => {
    const created = await gymSubscriptionService.create(
      platform,
      subscriptionInput(gymAId)
    );
    expect(created.status).toBe('trialing');
    expect(created.gymName).toBe('Gym A');

    await expect(
      gymSubscriptionService.create(platform, subscriptionInput(gymAId))
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      gymSubscriptionService.create(platform, subscriptionInput('missing'))
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('settles one period at the plan price and records the payment', async () => {
    const created = await gymSubscriptionService.create(
      platform,
      subscriptionInput(gymAId, '2026-01-31')
    );
    const paid = await gymSubscriptionService.recordPayment(
      platform,
      created.id,
      { paymentMethod: 'card' }
    );

    // One payment covers one period; this one started long ago, so it is still overdue.
    expect(paid.status).toBe('past_due');
    expect(paid.currentPeriodEnd).toBe('2026-02-28');
    expect(paid.nextPaymentDue).toBe('2026-02-28');

    const payments = await gymSubscriptionService.listPayments(platform);
    expect(payments).toHaveLength(1);
    expect(payments[0]?.amount).toBe(99);
    expect(payments[0]?.gymName).toBe('Gym A');
  });

  it('rejects payments on cancelled subscriptions', async () => {
    const created = await gymSubscriptionService.create(
      platform,
      subscriptionInput(gymAId)
    );
    await gymSubscriptionService.setStatus(platform, created.id, 'cancelled');
    await expect(
      gymSubscriptionService.recordPayment(platform, created.id, {
        paymentMethod: 'bank_transfer',
      })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.gymSubscriptionPayment.count()).toBe(0);
  });

  it('lets only one of two simultaneous payments claim the same period', async () => {
    const created = await gymSubscriptionService.create(
      platform,
      subscriptionInput(gymAId, '2026-03-01')
    );
    const results = await Promise.allSettled([
      gymSubscriptionService.recordPayment(platform, created.id, {
        paymentMethod: 'card',
      }),
      gymSubscriptionService.recordPayment(platform, created.id, {
        paymentMethod: 'card',
      }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.gymSubscriptionPayment.count()).toBe(1);
  });

  it('derives past due from the due date for active subscriptions only', async () => {
    const created = await gymSubscriptionService.create(
      platform,
      subscriptionInput(gymAId)
    );
    await prisma.gymSubscription.update({
      where: { id: created.id },
      data: { nextPaymentDue: day(-3) },
    });
    // A trial is never reported as past due.
    expect((await gymSubscriptionService.list(platform))[0]?.status).toBe(
      'trialing'
    );

    await prisma.gymSubscription.update({
      where: { id: created.id },
      data: { status: 'active' },
    });
    expect((await gymSubscriptionService.list(platform))[0]?.status).toBe(
      'past_due'
    );
  });
});

describe('dashboardService', () => {
  const seedGymA = async () => {
    const [active, inactive, clientC] = await Promise.all([
      prisma.client.create({
        data: { gymId: gymAId, fullName: 'Active', email: 'a1@test.dev' },
      }),
      prisma.client.create({
        data: {
          gymId: gymAId,
          fullName: 'Inactive',
          email: 'a2@test.dev',
          isActive: false,
        },
      }),
      prisma.client.create({
        data: { gymId: gymAId, fullName: 'Other', email: 'a3@test.dev' },
      }),
    ]);
    const plan = await prisma.membershipPlan.create({
      data: {
        gymId: gymAId,
        name: 'Monthly',
        type: 'monthly',
        durationDays: 30,
        price: '40.00',
      },
    });
    const membership = (
      clientId: string,
      endOffset: number,
      overrides: Record<string, unknown> = {}
    ) =>
      prisma.membership.create({
        data: {
          gymId: gymAId,
          clientId,
          planId: plan.id,
          planName: plan.name,
          planType: 'monthly',
          startDate: day(-5),
          endDate: day(endOffset),
          price: '40.00',
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          status: 'active',
          ...overrides,
        },
      });
    const clientMembership = await membership(active.id, 20);
    await membership(clientC.id, 3);
    await membership(inactive.id, 30, {
      paymentStatus: 'pending',
      status: 'pending',
    });

    const water = await prisma.product.create({
      data: { gymId: gymAId, name: 'Water', price: '1.00', stock: 2 },
    });
    await prisma.product.create({
      data: { gymId: gymAId, name: 'Shake', price: '4.00', stock: 50 },
    });
    await prisma.productSale.create({
      data: {
        gymId: gymAId,
        productId: water.id,
        quantity: 1,
        unitPrice: '10.00',
        total: '10.00',
        paymentMethod: 'cash',
      },
    });
    return { active, clientC, clientMembership };
  };

  it('summarises a gym from its own data only', async () => {
    await seedGymA();
    // Another gym's data must not leak into Gym A's numbers.
    await prisma.client.create({
      data: { gymId: gymBId, fullName: 'B', email: 'b@test.dev' },
    });

    const summary = await dashboardService.forGym(
      tenantContext(gymAId, 'gym_admin')
    );
    expect(summary.gymName).toBe('Gym A');
    expect(summary.totalClients).toBe(3);
    expect(summary.activeClients).toBe(2);
    expect(summary.activeMemberships).toBe(2);
    expect(summary.expiringSoon).toBe(1);
    expect(summary.pendingPayments).toBe(1);
    expect(summary.lowStockProducts).toBe(1);
    expect(summary.revenueThisMonth).toBe(90);
    // The soonest-ending membership is listed; the other gym's data is not.
    expect(summary.expiringMemberships).toHaveLength(1);
    expect(summary.visitsByDay).toHaveLength(7);
    expect(summary.recentCheckIns).toEqual([]);
  });

  it('summarises a client with balance, membership and visits', async () => {
    const { active, clientC, clientMembership } = await seedGymA();
    await prisma.balanceTransaction.create({
      data: {
        gymId: gymAId,
        clientId: active.id,
        type: 'deposit',
        amount: '25.00',
        paymentMethod: 'cash',
        providerStatus: 'paid',
      },
    });
    const visit = (clientId: string, checkedInAt: Date) =>
      prisma.attendance.create({
        data: {
          gymId: gymAId,
          clientId,
          membershipId: clientMembership.id,
          checkedInAt,
        },
      });
    const ago = (days: number) => new Date(Date.now() - days * 86_400_000);
    await visit(active.id, ago(40));
    await visit(active.id, ago(3));
    await visit(active.id, ago(1));
    await visit(clientC.id, new Date());

    const summary = await dashboardService.forClient(
      tenantContext(gymAId, 'client', active.id)
    );
    expect(summary.clientId).toBe(active.id);
    expect(summary.balance).toBe(25);
    expect(summary.activeMembership?.planName).toBe('Monthly');
    expect(summary.attendance).toEqual({
      total: 3,
      last7Days: 2,
      last30Days: 2,
    });
    expect(summary.currentlyInside).toBe(1);
  });

  it('summarises the platform across gyms', async () => {
    await seedGymA();
    const subA = await gymSubscriptionService.create(
      platform,
      subscriptionInput(gymAId)
    );
    await gymSubscriptionService.recordPayment(platform, subA.id, {
      paymentMethod: 'card',
    });
    const subB = await gymSubscriptionService.create(
      platform,
      subscriptionInput(gymBId)
    );
    await prisma.gymSubscription.update({
      where: { id: subB.id },
      data: { status: 'active', nextPaymentDue: day(-2) },
    });

    const summary = await dashboardService.forPlatform(platform);
    expect(summary.totalGyms).toBe(2);
    expect(summary.activeGyms).toBe(1);
    expect(summary.inactiveGyms).toBe(1);
    expect(summary.totalClients).toBe(3);
    expect(summary.subscriptions).toEqual({
      trialing: 0,
      active: 1,
      pastDue: 1,
      cancelled: 0,
    });
    expect(summary.revenueTotal).toBe(99);
    expect(summary.overdueAmount).toBe(99);
  });
});
