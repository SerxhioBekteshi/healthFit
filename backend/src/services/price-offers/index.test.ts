import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { membershipPlanService } from '@/services/membership-plans';
import { membershipService } from '@/services/memberships';
import { priceOfferService } from '@/services/price-offers';
import { ledger } from '@/services/ledger';
import { NotFoundError, ValidationError } from '@/errors';
import type { PriceOfferFormValues } from '@gym/shared/validation/price-offers';

const prisma = new PrismaClient();

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

// Wide ranges keep the tests clear of the gym-local midnight.
const isoDay = (offsetDays: number): string =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

let ctxA: TenantContext;
let ctxB: TenantContext;
let clientId: string;
let monthlyId: string;
let yearlyId: string;
let otherGymPlanId: string;

const offer = (
  overrides: Partial<PriceOfferFormValues> = {}
): PriceOfferFormValues => ({
  name: 'New Year',
  startDate: isoDay(-3),
  endDate: isoDay(3),
  items: [{ planId: monthlyId, price: 30 }],
  ...overrides,
});

const planInput = (name: string, price: number, durationDays: number) => ({
  name,
  type: durationDays > 100 ? ('yearly' as const) : ('monthly' as const),
  durationDays,
  visitCount: 0,
  gender: 'male' as const,
  weeklyVisits: 3,
  price,
});

const wipe = async (): Promise<void> => {
  await prisma.balanceTransaction.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.priceOffer.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  const gymA = await prisma.gym.create({ data: { name: 'Gym A' } });
  const gymB = await prisma.gym.create({ data: { name: 'Gym B' } });
  ctxA = contextFor(gymA.id);
  ctxB = contextFor(gymB.id);
  clientId = (
    await prisma.client.create({
      data: { gymId: gymA.id, fullName: 'A', email: 'a@test.dev' },
    })
  ).id;
  monthlyId = (
    await membershipPlanService.create(ctxA, planInput('Monthly', 40, 30))
  ).id;
  yearlyId = (
    await membershipPlanService.create(ctxA, planInput('Yearly', 400, 365))
  ).id;
  otherGymPlanId = (
    await membershipPlanService.create(ctxB, planInput('Monthly', 40, 30))
  ).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

const priceOf = async (planId: string) =>
  (await membershipPlanService.list(ctxA)).find((plan) => plan.id === planId);

describe('priceOfferService', () => {
  it("only accepts prices lower than the regular price, for the gym's own plans", async () => {
    await expect(
      priceOfferService.create(
        ctxA,
        offer({ items: [{ planId: monthlyId, price: 40 }] })
      )
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      priceOfferService.create(
        ctxA,
        offer({ items: [{ planId: otherGymPlanId, price: 10 }] })
      )
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await priceOfferService.list(ctxA)).toEqual([]);
  });

  it('derives the status from the dates and the pause switch', async () => {
    const running = await priceOfferService.create(ctxA, offer());
    const later = await priceOfferService.create(
      ctxA,
      offer({ name: 'Later', startDate: isoDay(10), endDate: isoDay(20) })
    );
    const over = await priceOfferService.create(
      ctxA,
      offer({ name: 'Over', startDate: isoDay(-20), endDate: isoDay(-10) })
    );
    expect(running.status).toBe('active');
    expect(later.status).toBe('scheduled');
    expect(over.status).toBe('ended');
    expect(running.items[0]).toMatchObject({ regularPrice: 40, price: 30 });

    const paused = await priceOfferService.setActive(ctxA, running.id, false);
    expect(paused.status).toBe('paused');
  });

  it('shows the lowest valid offer on the plan and ignores the others', async () => {
    await priceOfferService.create(ctxA, offer());
    await priceOfferService.create(
      ctxA,
      offer({ name: 'Flash', items: [{ planId: monthlyId, price: 25 }] })
    );
    await priceOfferService.create(
      ctxA,
      offer({ name: 'Later', startDate: isoDay(10), endDate: isoDay(20) })
    );
    const plan = await priceOf(monthlyId);
    expect(plan?.price).toBe(40);
    expect(plan?.offer).toMatchObject({ name: 'Flash', price: 25 });
    expect((await priceOf(yearlyId))?.offer).toBeNull();
  });

  it('charges the offer price while it is valid and the regular price after', async () => {
    const created = await priceOfferService.create(ctxA, offer());
    const bought = await membershipService.create(ctxA, {
      clientId,
      planId: monthlyId,
      startDate: isoDay(0),
      paymentMethod: 'cash',
    });
    expect(bought.price).toBe(30);

    await prisma.balanceTransaction.create({
      data: {
        gymId: ctxA.gymId,
        clientId,
        type: 'deposit',
        amount: '100.00',
        paymentMethod: 'cash',
        providerStatus: 'paid',
      },
    });
    await membershipService.create(ctxA, {
      clientId,
      planId: monthlyId,
      startDate: isoDay(0),
      paymentMethod: 'balance',
    });
    expect((await ledger.balance(ctxA.db, clientId)).toNumber()).toBe(70);

    await priceOfferService.setActive(ctxA, created.id, false);
    const regular = await membershipService.create(ctxA, {
      clientId,
      planId: monthlyId,
      startDate: isoDay(0),
      paymentMethod: 'cash',
    });
    expect(regular.price).toBe(40);
  });

  it('replaces the plans when edited, keeps bought prices when deleted and isolates gyms', async () => {
    const created = await priceOfferService.create(ctxA, offer());
    const bought = await membershipService.create(ctxA, {
      clientId,
      planId: monthlyId,
      startDate: isoDay(0),
      paymentMethod: 'cash',
    });

    const edited = await priceOfferService.update(
      ctxA,
      created.id,
      offer({ items: [{ planId: yearlyId, price: 350 }] })
    );
    expect(edited.items.map((item) => item.planId)).toEqual([yearlyId]);
    expect((await priceOf(monthlyId))?.offer).toBeNull();
    expect((await priceOf(yearlyId))?.offer?.price).toBe(350);

    expect(await priceOfferService.list(ctxB)).toEqual([]);
    await expect(
      priceOfferService.setActive(ctxB, created.id, false)
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      priceOfferService.remove(ctxB, created.id)
    ).rejects.toBeInstanceOf(NotFoundError);

    await priceOfferService.remove(ctxA, created.id);
    expect(await priceOfferService.list(ctxA)).toEqual([]);
    const history = await membershipService.list(ctxA);
    expect(history.find((item) => item.id === bought.id)?.price).toBe(30);
  });
});
