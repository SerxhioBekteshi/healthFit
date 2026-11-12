import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { membershipPlanService } from '@/services/membership-plans';
import { membershipService } from '@/services/memberships';
import { ledger } from '@/services/ledger';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';

const prisma = new PrismaClient();

let gymAId: string;
let gymBId: string;
let ctxA: TenantContext;
let ctxB: TenantContext;
let clientAId: string;
let clientBId: string;
let planAId: string;
let planBId: string;

const contextFor = (gymId: string): TenantContext => ({
  user: {
    id: `admin-${gymId}`,
    email: `admin-${gymId}@test.dev`,
    name: 'Admin',
    role: 'gym_admin',
    gymId,
  },
  role: 'gym_admin',
  gymId,
  clientId: null,
  db: createTenantDb(prisma, gymId),
});

const isoDay = (offsetDays: number): string =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

const deposit = (gymId: string, clientId: string, amount: string) =>
  prisma.balanceTransaction.create({
    data: {
      gymId,
      clientId,
      type: 'deposit',
      amount,
      paymentMethod: 'cash',
      providerStatus: 'paid',
    },
  });

const wipe = async (): Promise<void> => {
  await prisma.balanceTransaction.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();

  gymAId = (await prisma.gym.create({ data: { name: 'Gym A' } })).id;
  gymBId = (await prisma.gym.create({ data: { name: 'Gym B' } })).id;
  ctxA = contextFor(gymAId);
  ctxB = contextFor(gymBId);

  clientAId = (
    await prisma.client.create({
      data: { gymId: gymAId, fullName: 'A', email: 'a@test.dev' },
    })
  ).id;
  clientBId = (
    await prisma.client.create({
      data: { gymId: gymBId, fullName: 'B', email: 'b@test.dev' },
    })
  ).id;

  const planInput = {
    name: 'Monthly',
    type: 'monthly' as const,
    durationDays: 30,
    visitCount: 0,
    gender: 'male' as const,
    weeklyVisits: 4,
    price: 40,
  };
  planAId = (await membershipPlanService.create(ctxA, planInput)).id;
  planBId = (await membershipPlanService.create(ctxB, planInput)).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

const assign = (
  ctx: TenantContext,
  clientId: string,
  planId: string,
  paymentMethod: 'cash' | 'bank_transfer' | 'balance' = 'cash',
  startDate = isoDay(0)
) =>
  membershipService.create(ctx, {
    clientId,
    planId,
    startDate,
    paymentMethod,
  });

describe('membership plans', () => {
  it('stores no visit count for non-visit plans and isolates gyms', async () => {
    const plan = await membershipPlanService.create(ctxA, {
      name: 'Yearly',
      type: 'yearly',
      durationDays: 365,
      visitCount: 12,
      gender: 'male',
      weeklyVisits: 4,
      price: 300,
    });
    expect(plan.visitCount).toBe(0);
    expect(plan.price).toBe(300);

    await expect(
      membershipPlanService.setActive(ctxB, plan.id, false)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect((await membershipPlanService.list(ctxB)).map((p) => p.id)).toEqual([
      planBId,
    ]);
  });
});

describe('membershipService', () => {
  it('activates a cash membership and records a settled ledger row', async () => {
    const membership = await assign(ctxA, clientAId, planAId);
    expect(membership.status).toBe('active');
    expect(membership.paymentStatus).toBe('paid');
    expect(membership.endDate).toBe(isoDay(30));

    const rows = await prisma.balanceTransaction.findMany({
      where: { clientId: clientAId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.gymId).toBe(gymAId);
    expect(rows[0]?.providerStatus).toBe('paid');
  });

  it('keeps bank transfers pending until the gym confirms them', async () => {
    const pending = await assign(ctxA, clientAId, planAId, 'bank_transfer');
    expect(pending.status).toBe('pending');
    expect(pending.paymentStatus).toBe('pending');
    expect(
      await membershipService.findActiveForClient(ctxA.db, clientAId)
    ).toBeNull();

    const confirmed = await membershipService.confirmPayment(ctxA, pending.id);
    expect(confirmed.status).toBe('active');
    expect(confirmed.paymentStatus).toBe('paid');

    const row = await prisma.balanceTransaction.findFirstOrThrow({
      where: { clientId: clientAId },
    });
    expect(row.providerStatus).toBe('paid');

    await expect(
      membershipService.confirmPayment(ctxA, pending.id)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('debits the client balance and rejects insufficient funds', async () => {
    await expect(
      assign(ctxA, clientAId, planAId, 'balance')
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.membership.count()).toBe(0);

    await deposit(gymAId, clientAId, '100.00');
    await assign(ctxA, clientAId, planAId, 'balance');
    expect((await ledger.balance(ctxA.db, clientAId)).toNumber()).toBe(60);
  });

  it('never lets concurrent balance payments overdraw the balance', async () => {
    await deposit(gymAId, clientAId, '50.00');
    const results = await Promise.allSettled([
      assign(ctxA, clientAId, planAId, 'balance'),
      assign(ctxA, clientAId, planAId, 'balance'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.membership.count()).toBe(1);
    expect((await ledger.balance(ctxA.db, clientAId)).toNumber()).toBe(10);
  });

  it('does not cross gym boundaries', async () => {
    await expect(assign(ctxA, clientBId, planAId)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(assign(ctxA, clientAId, planBId)).rejects.toBeInstanceOf(
      NotFoundError
    );

    const own = await assign(ctxB, clientBId, planBId);
    await expect(membershipService.cancel(ctxA, own.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(
      membershipService.renew(ctxA, own.id, {
        startDate: isoDay(0),
        paymentMethod: 'cash',
      })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await membershipService.list(ctxA)).toHaveLength(0);
  });

  it('shows clients only their own memberships', async () => {
    const otherClient = await prisma.client.create({
      data: { gymId: gymAId, fullName: 'Other', email: 'other@test.dev' },
    });
    await assign(ctxA, clientAId, planAId);
    await assign(ctxA, otherClient.id, planAId);

    const clientCtx: TenantContext = {
      ...ctxA,
      role: 'client',
      clientId: clientAId,
    };
    const mine = await membershipService.list(clientCtx);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.clientId).toBe(clientAId);
    expect(await membershipService.list(ctxA)).toHaveLength(2);
  });

  it('pages the history latest first without repeats', async () => {
    const day = (offset: number): Date =>
      new Date(`${isoDay(offset)}T00:00:00Z`);
    for (const daysAgo of [0, 1, 2, 3, 4]) {
      // Seeded directly: assigning would queue them one after another.
      await prisma.membership.create({
        data: {
          gymId: gymAId,
          clientId: clientAId,
          planId: planAId,
          planName: 'Monthly',
          planType: 'monthly',
          startDate: day(-daysAgo),
          endDate: day(-daysAgo + 30),
          price: 40,
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          status: 'active',
        },
      });
    }
    const clientCtx: TenantContext = {
      ...ctxA,
      role: 'client',
      clientId: clientAId,
    };
    const startDays = (page: { memberships: { startDate: string }[] }) =>
      page.memberships.map((row) => row.startDate);

    const first = await membershipService.history(clientCtx, { limit: 2 });
    expect(startDays(first)).toEqual([isoDay(0), isoDay(-1)]);
    expect(first.nextCursor).not.toBeNull();

    const second = await membershipService.history(clientCtx, {
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(startDays(second)).toEqual([isoDay(-2), isoDay(-3)]);

    const last = await membershipService.history(clientCtx, {
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });
    expect(startDays(last)).toEqual([isoDay(-4)]);
    expect(last.nextCursor).toBeNull();
  });

  it('filters the history by status and by the period it overlaps', async () => {
    const day = (offset: number): Date =>
      new Date(`${isoDay(offset)}T00:00:00Z`);
    const seed = (
      name: string,
      start: number,
      end: number,
      status: 'active' | 'pending' | 'cancelled'
    ) =>
      prisma.membership.create({
        data: {
          gymId: gymAId,
          clientId: clientAId,
          planId: planAId,
          planName: name,
          planType: 'monthly',
          startDate: day(start),
          endDate: day(end),
          price: 40,
          paymentMethod: 'cash',
          paymentStatus: status === 'pending' ? 'pending' : 'paid',
          status,
        },
      });
    await seed('Finished', -60, -30, 'active');
    await seed('Current', -5, 25, 'active');
    await seed('Next', 26, 56, 'active');
    await seed('Cancelled', -100, -70, 'cancelled');
    await seed('Waiting', 40, 70, 'pending');
    const clientCtx: TenantContext = {
      ...ctxA,
      role: 'client',
      clientId: clientAId,
    };
    const names = async (
      filters: Parameters<typeof membershipService.history>[1]
    ) =>
      (await membershipService.history(clientCtx, filters)).memberships
        .map((row) => row.planName)
        .sort();

    expect(await names({})).toHaveLength(5);
    expect(await names({ status: 'expired' })).toEqual(['Finished']);
    expect(await names({ status: 'active' })).toEqual(['Current']);
    expect(await names({ status: 'upcoming' })).toEqual(['Next']);
    expect(await names({ status: 'cancelled' })).toEqual(['Cancelled']);
    expect(await names({ status: 'pending' })).toEqual(['Waiting']);

    // Overlap: running during the range, even when it started before it.
    expect(await names({ from: isoDay(-10), to: isoDay(0) })).toEqual([
      'Current',
    ]);
    expect(await names({ from: isoDay(-40), to: isoDay(-20) })).toEqual([
      'Finished',
    ]);
    expect(await names({ from: isoDay(30) })).toEqual(['Next', 'Waiting']);
    expect(await names({ status: 'active', from: isoDay(30) })).toEqual([]);
  });

  it('reports ended memberships as expired and not usable', async () => {
    const old = await assign(ctxA, clientAId, planAId, 'cash', isoDay(-60));
    expect(old.status).toBe('expired');
    expect(
      await membershipService.findActiveForClient(ctxA.db, clientAId)
    ).toBeNull();

    const renewed = await membershipService.renew(ctxA, old.id, {
      startDate: isoDay(0),
      paymentMethod: 'cash',
    });
    expect(renewed.status).toBe('active');
    expect(
      (await membershipService.findActiveForClient(ctxA.db, clientAId))?.id
    ).toBe(renewed.id);
  });

  it('tracks visits for visit-based plans and ignores future starts', async () => {
    const visitPlan = await membershipPlanService.create(ctxA, {
      name: '10 visits',
      type: 'visit_based',
      durationDays: 90,
      visitCount: 10,
      gender: 'male',
      weeklyVisits: 0,
      price: 80,
    });
    const pack = await assign(ctxA, clientAId, visitPlan.id);
    expect(pack.visitsRemaining).toBe(10);

    await prisma.membership.update({
      where: { id: pack.id },
      data: { visitsRemaining: 0 },
    });
    expect(
      await membershipService.findActiveForClient(ctxA.db, clientAId)
    ).toBeNull();

    await assign(ctxA, clientAId, planAId, 'cash', isoDay(5));
    expect(
      await membershipService.findActiveForClient(ctxA.db, clientAId)
    ).toBeNull();
  });

  it('queues each new membership after the last one ends', async () => {
    const sixMonths = await membershipPlanService.create(ctxA, {
      name: '6 months',
      type: 'six_months',
      durationDays: 180,
      visitCount: 0,
      gender: 'male',
      weeklyVisits: 4,
      price: 200,
    });

    const first = await assign(ctxA, clientAId, planAId);
    expect([first.status, first.startDate, first.endDate]).toEqual([
      'active',
      isoDay(0),
      isoDay(30),
    ]);

    // Bought weeks before the first one ends: it starts the day after.
    const second = await assign(ctxA, clientAId, planAId, 'cash', isoDay(10));
    expect([second.status, second.startDate, second.endDate]).toEqual([
      'upcoming',
      isoDay(31),
      isoDay(61),
    ]);

    // An offer later on queues behind the second.
    const third = await assign(ctxA, clientAId, sixMonths.id);
    expect([third.status, third.startDate, third.endDate]).toEqual([
      'upcoming',
      isoDay(62),
      isoDay(242),
    ]);

    // Only the running one lets the client in.
    expect(
      (await membershipService.findActiveForClient(ctxA.db, clientAId))?.id
    ).toBe(first.id);

    // A start date after the whole queue is kept, and other clients are unaffected.
    const later = await assign(ctxA, clientAId, planAId, 'cash', isoDay(400));
    expect(later.startDate).toBe(isoDay(400));
    const otherClient = await prisma.client.create({
      data: { gymId: gymAId, fullName: 'Other', email: 'other@test.dev' },
    });
    const alone = await assign(ctxA, otherClient.id, planAId);
    expect(alone.startDate).toBe(isoDay(0));
  });

  it('queues renewals behind memberships that are already booked', async () => {
    const first = await assign(ctxA, clientAId, planAId);
    const renewed = await membershipService.renew(ctxA, first.id, {
      startDate: isoDay(0),
      paymentMethod: 'cash',
    });
    expect(renewed.startDate).toBe(isoDay(31));
    expect(renewed.status).toBe('upcoming');
  });
});

describe('client self-subscription', () => {
  const asClient = (clientId: string): TenantContext => ({
    ...ctxA,
    role: 'client',
    clientId,
  });

  const femalePlan = () =>
    membershipPlanService.create(ctxA, {
      name: '3x / week',
      type: 'monthly',
      durationDays: 30,
      visitCount: 0,
      gender: 'female',
      weeklyVisits: 3,
      price: 4000,
    });

  it('lists only active plans sold to the client gender', async () => {
    await prisma.client.update({
      where: { id: clientAId },
      data: { gender: 'female' },
    });
    const plan = await femalePlan();

    const listed = await membershipPlanService.list(asClient(clientAId));
    expect(listed.map((p) => p.id)).toEqual([plan.id]);

    await membershipPlanService.setActive(ctxA, plan.id, false);
    expect(await membershipPlanService.list(asClient(clientAId))).toEqual([]);
  });

  it('shows no plans and blocks subscribing while gender is unset', async () => {
    expect(await membershipPlanService.list(asClient(clientAId))).toEqual([]);
    await expect(
      membershipService.subscribe(
        asClient(clientAId),
        {
          planId: planAId,
          paymentMethod: 'card',
        },
        { verified: true }
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a plan sold to the other gender, also for admins', async () => {
    await prisma.client.update({
      where: { id: clientAId },
      data: { gender: 'female' },
    });
    await expect(
      membershipService.subscribe(
        asClient(clientAId),
        {
          planId: planAId,
          paymentMethod: 'card',
        },
        { verified: true }
      )
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(assign(ctxA, clientAId, planAId)).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it('charges the card and activates immediately', async () => {
    await prisma.client.update({
      where: { id: clientAId },
      data: { gender: 'male' },
    });
    const active = await membershipService.subscribe(
      asClient(clientAId),
      {
        planId: planAId,
        paymentMethod: 'card',
      },
      { verified: true }
    );
    expect(active.status).toBe('active');
    expect(active.weeklyVisits).toBe(4);
  });

  it('blocks subscribing while a bank transfer waits for confirmation', async () => {
    await prisma.client.update({
      where: { id: clientAId },
      data: { gender: 'male' },
    });
    const pending = await assign(ctxA, clientAId, planAId, 'bank_transfer');
    expect(pending.status).toBe('pending');

    await expect(
      membershipService.subscribe(
        asClient(clientAId),
        {
          planId: planAId,
          paymentMethod: 'card',
        },
        { verified: true }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    const confirmed = await membershipService.confirmPayment(ctxA, pending.id);
    expect(confirmed.status).toBe('active');
  });

  it('refuses a card payment that was not verified', async () => {
    await prisma.client.update({
      where: { id: clientAId },
      data: { gender: 'male' },
    });
    await expect(
      membershipService.subscribe(asClient(clientAId), {
        planId: planAId,
        paymentMethod: 'card',
        card: { brand: 'visa', last4: '4242' },
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
  it('pays from the balance and activates immediately', async () => {
    await prisma.client.update({
      where: { id: clientAId },
      data: { gender: 'male' },
    });
    await deposit(gymAId, clientAId, '100.00');
    const active = await membershipService.subscribe(asClient(clientAId), {
      planId: planAId,
      paymentMethod: 'balance',
    });
    expect(active.status).toBe('active');
    expect((await ledger.balance(ctxA.db, clientAId)).toNumber()).toBe(60);
  });

  it('queues a second subscription after the running one', async () => {
    await prisma.client.update({
      where: { id: clientAId },
      data: { gender: 'male' },
    });
    await deposit(gymAId, clientAId, '100.00');
    const first = await membershipService.subscribe(asClient(clientAId), {
      planId: planAId,
      paymentMethod: 'balance',
    });
    const second = await membershipService.subscribe(asClient(clientAId), {
      planId: planAId,
      paymentMethod: 'balance',
    });
    expect(second.status).toBe('upcoming');
    expect(second.startDate).toBe(isoDay(31));
    expect(first.endDate).toBe(isoDay(30));
  });
});
