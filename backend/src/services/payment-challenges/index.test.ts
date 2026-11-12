import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';
import { balanceService } from '@/services/balance';
import { paymentChallengeService } from '@/services/payment-challenges';

const prisma = new PrismaClient();

let gymId: string;
let clientId: string;
let otherClientId: string;

const contextFor = (id: string): TenantContext => ({
  user: {
    id: `user-${id}`,
    email: 'c@test.dev',
    name: 'Client',
    role: 'client',
    gymId,
  },
  role: 'client',
  gymId,
  clientId: id,
  db: createTenantDb(prisma, gymId),
});

const adminContext = (): TenantContext => ({
  ...contextFor(clientId),
  user: {
    id: 'admin',
    email: 'a@test.dev',
    name: 'Admin',
    role: 'gym_admin',
    gymId,
  },
  role: 'gym_admin',
  clientId: null,
});

const card = { brand: 'visa' as const, last4: '4242' };

const startDeposit = (ctx: TenantContext, amount = 2500) =>
  paymentChallengeService.start(ctx, {
    kind: 'deposit',
    deposit: { amount, paymentMethod: 'card', card },
  });

const wipe = async (): Promise<void> => {
  await prisma.paymentChallenge.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  gymId = (await prisma.gym.create({ data: { name: 'Gym' } })).id;
  clientId = (
    await prisma.client.create({
      data: { gymId, fullName: 'A', email: 'a@test.dev' },
    })
  ).id;
  otherClientId = (
    await prisma.client.create({
      data: { gymId, fullName: 'B', email: 'b@test.dev' },
    })
  ).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('paymentChallengeService', () => {
  it('only lets members start a card verification', async () => {
    await expect(startDeposit(adminContext())).rejects.toBeInstanceOf(
      ForbiddenError
    );
    await expect(
      paymentChallengeService.start(contextFor(clientId), {
        kind: 'membership',
        subscription: { planId: 'plan', paymentMethod: 'balance' },
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses a direct card deposit and pays only after the right code', async () => {
    const ctx = contextFor(clientId);
    await expect(
      balanceService.deposit(ctx, {
        amount: 2500,
        paymentMethod: 'card',
        card,
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    const challenge = await startDeposit(ctx);
    expect(challenge.demoCode).toMatch(/^\d{6}$/);

    const result = await paymentChallengeService.verify(
      ctx,
      challenge.challengeId,
      challenge.demoCode ?? ''
    );
    expect(result.kind).toBe('deposit');
    expect((await balanceService.summary(ctx)).balance).toBe(2500);

    // The code works once.
    await expect(
      paymentChallengeService.verify(
        ctx,
        challenge.challengeId,
        challenge.demoCode ?? ''
      )
    ).rejects.toBeInstanceOf(NotFoundError);
    expect((await balanceService.summary(ctx)).balance).toBe(2500);
  });

  it('locks after three wrong codes, even for the right one', async () => {
    const ctx = contextFor(clientId);
    const challenge = await startDeposit(ctx);
    const wrong = challenge.demoCode === '000000' ? '111111' : '000000';

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(
        paymentChallengeService.verify(ctx, challenge.challengeId, wrong)
      ).rejects.toBeInstanceOf(ValidationError);
    }
    await expect(
      paymentChallengeService.verify(
        ctx,
        challenge.challengeId,
        challenge.demoCode ?? ''
      )
    ).rejects.toBeInstanceOf(ValidationError);
    expect((await balanceService.summary(ctx)).balance).toBe(0);
  });

  it('expires codes and replaces older challenges when restarted', async () => {
    const ctx = contextFor(clientId);
    const first = await startDeposit(ctx);
    const second = await startDeposit(ctx);

    await expect(
      paymentChallengeService.verify(
        ctx,
        first.challengeId,
        first.demoCode ?? ''
      )
    ).rejects.toBeInstanceOf(NotFoundError);

    await prisma.paymentChallenge.update({
      where: { id: second.challengeId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expect(
      paymentChallengeService.verify(
        ctx,
        second.challengeId,
        second.demoCode ?? ''
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("does not let another member use someone else's challenge", async () => {
    const challenge = await startDeposit(contextFor(clientId));
    await expect(
      paymentChallengeService.verify(
        contextFor(otherClientId),
        challenge.challengeId,
        challenge.demoCode ?? ''
      )
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
