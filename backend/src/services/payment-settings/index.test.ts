import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ValidationError } from '@/errors';
import { balanceService } from '@/services/balance';
import { membershipPlanService } from '@/services/membership-plans';
import { membershipService } from '@/services/memberships';
import { paymentChallengeService } from '@/services/payment-challenges';
import { paymentSettingsService } from '@/services/payment-settings';
import { productService } from '@/services/products';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { paymentSettingsSchema } from '@gym/shared/validation/payment-settings';

const prisma = new PrismaClient();

let gymId: string;
let otherGymId: string;
let clientId: string;
let planId: string;
let productId: string;

const adminContext = (id: string): TenantContext => ({
  user: {
    id: `admin-${id}`,
    email: `admin-${id}@test.dev`,
    name: 'Admin',
    role: 'gym_admin',
    gymId: id,
  },
  role: 'gym_admin',
  gymId: id,
  clientId: null,
  db: createTenantDb(prisma, id),
});

const clientContext = (): TenantContext => ({
  ...adminContext(gymId),
  user: {
    id: 'user-client',
    email: 'c@test.dev',
    name: 'Client',
    role: 'client',
    gymId,
  },
  role: 'client',
  clientId,
});

const settings = (
  overrides: Partial<{
    acceptCard: boolean;
    acceptBalance: boolean;
    acceptCash: boolean;
  }>
) =>
  paymentSettingsService.update(adminContext(gymId), {
    acceptCard: true,
    acceptBalance: true,
    acceptCash: true,
    ...overrides,
  });

const fund = (amount: string) =>
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

const today = (): string => new Date().toISOString().slice(0, 10);

const wipe = async (): Promise<void> => {
  await prisma.paymentChallenge.deleteMany();
  await prisma.productSale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  gymId = (await prisma.gym.create({ data: { name: 'A' } })).id;
  otherGymId = (await prisma.gym.create({ data: { name: 'B' } })).id;
  clientId = (
    await prisma.client.create({
      data: {
        gymId,
        fullName: 'Client',
        email: 'c@test.dev',
        gender: 'male',
      },
    })
  ).id;
  planId = (
    await membershipPlanService.create(adminContext(gymId), {
      name: 'Monthly',
      type: 'monthly',
      durationDays: 30,
      visitCount: 0,
      gender: 'male',
      weeklyVisits: 4,
      price: 40,
    })
  ).id;
  productId = (
    await productService.create(adminContext(gymId), {
      name: 'Water',
      price: 2,
      stock: 5,
    })
  ).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('paymentSettingsService', () => {
  it('starts with every way of paying on, for admins and members', async () => {
    const all = { acceptCard: true, acceptBalance: true, acceptCash: true };
    expect(await paymentSettingsService.get(adminContext(gymId))).toEqual(all);
    expect(await paymentSettingsService.get(clientContext())).toEqual(all);
  });

  it('saves the choice for one gym only', async () => {
    await settings({ acceptCash: false });
    expect(
      (await paymentSettingsService.get(adminContext(gymId))).acceptCash
    ).toBe(false);
    expect(
      (await paymentSettingsService.get(adminContext(otherGymId))).acceptCash
    ).toBe(true);
  });

  it('requires at least one way of paying', () => {
    const off = { acceptCard: false, acceptBalance: false, acceptCash: false };
    expect(paymentSettingsSchema.safeParse(off).success).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({ ...off, acceptCash: true }).success
    ).toBe(true);
  });
});

describe('payment settings are enforced', () => {
  it('refuses cash everywhere when cash is off', async () => {
    await settings({ acceptCash: false });
    const admin = adminContext(gymId);

    await expect(
      membershipService.create(admin, {
        clientId,
        planId,
        startDate: today(),
        paymentMethod: 'cash',
      })
    ).rejects.toThrow('Cash payments are not accepted by this gym.');
    await expect(
      balanceService.deposit(admin, {
        clientId,
        amount: 10,
        paymentMethod: 'cash',
      })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      productService.sell(admin, productId, {
        paymentMethod: 'cash',
      })
    ).rejects.toThrow('Cash payments are not accepted by this gym.');

    // Counter payments still work with the other methods.
    await fund('100.00');
    const membership = await membershipService.create(admin, {
      clientId,
      planId,
      startDate: today(),
      paymentMethod: 'balance',
    });
    expect(membership.paymentStatus).toBe('paid');
  });

  it('refuses card payments when card is off', async () => {
    await settings({ acceptCard: false });
    const ctx = clientContext();

    await expect(
      membershipService.subscribe(
        ctx,
        {
          planId,
          paymentMethod: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
        { verified: true }
      )
    ).rejects.toThrow('Card payments are not accepted by this gym.');
    await expect(
      balanceService.deposit(
        ctx,
        {
          amount: 10,
          paymentMethod: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
        { verified: true }
      )
    ).rejects.toThrow('Card payments are not accepted by this gym.');
    await expect(
      paymentChallengeService.start(ctx, {
        kind: 'deposit',
        deposit: {
          amount: 10,
          paymentMethod: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      })
    ).rejects.toThrow('Card payments are not accepted by this gym.');

    // Credit still works.
    await fund('100.00');
    const membership = await membershipService.subscribe(ctx, {
      planId,
      paymentMethod: 'balance',
    });
    expect(membership.paymentStatus).toBe('paid');
  });

  it('refuses the balance and top-ups when credit is off', async () => {
    await fund('100.00');
    await settings({ acceptBalance: false });
    const ctx = clientContext();

    await expect(
      membershipService.subscribe(ctx, { planId, paymentMethod: 'balance' })
    ).rejects.toThrow('Paying from the balance is not accepted by this gym.');
    await expect(
      productService.sell(ctx, productId, { paymentMethod: 'balance' })
    ).rejects.toThrow('Paying from the balance is not accepted by this gym.');
    await expect(
      balanceService.deposit(adminContext(gymId), {
        clientId,
        amount: 10,
        paymentMethod: 'cash',
      })
    ).rejects.toThrow('This gym does not use balance credit.');
    await expect(
      balanceService.deposit(
        ctx,
        {
          amount: 10,
          paymentMethod: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
        { verified: true }
      )
    ).rejects.toThrow('This gym does not use balance credit.');

    // Card and cash memberships are still sold.
    const membership = await membershipService.create(adminContext(gymId), {
      clientId,
      planId,
      startDate: today(),
      paymentMethod: 'cash',
    });
    expect(membership.paymentStatus).toBe('paid');
  });

  it('keeps working as before when everything is on', async () => {
    const ctx = clientContext();
    await balanceService.deposit(
      ctx,
      {
        amount: 60,
        paymentMethod: 'card',
        card: { brand: 'visa', last4: '4242' },
      },
      { verified: true }
    );
    const membership = await membershipService.subscribe(ctx, {
      planId,
      paymentMethod: 'balance',
    });
    expect(membership.paymentStatus).toBe('paid');
  });
});
