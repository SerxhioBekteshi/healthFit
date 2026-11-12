import {
  createHash,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { env } from '@/config/env';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';
import { balanceService } from '@/services/balance';
import { membershipService } from '@/services/memberships';
import type { TenantContext } from '@/tenant/context';
import type {
  PaymentChallenge,
  PaymentChallengeResult,
} from '@gym/shared/types';
import {
  CHALLENGE_CODE_LENGTH,
  startChallengeSchema,
  type StartChallengeValues,
} from '@gym/shared/validation/payment-challenges';

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const hashCode = (challengeId: string, code: string): string =>
  createHash('sha256').update(`${challengeId}:${code}`).digest('hex');

const sameHash = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const randomCode = (): string =>
  String(
    randomInt(10 ** (CHALLENGE_CODE_LENGTH - 1), 10 ** CHALLENGE_CODE_LENGTH)
  );

// One-time-code check (3-D Secure style) in front of every client card payment.
// There is no SMS provider yet: outside production the code is returned so it can be shown in the UI.
export const paymentChallengeService = {
  async start(
    ctx: TenantContext,
    input: StartChallengeValues
  ): Promise<PaymentChallenge> {
    if (ctx.role !== 'client' || !ctx.clientId) {
      throw new ForbiddenError('Only members verify card payments.');
    }
    const method =
      input.kind === 'deposit'
        ? input.deposit.paymentMethod
        : input.subscription.paymentMethod;
    if (method !== 'card') {
      throw new ValidationError('Only card payments need verification.');
    }

    const challengeId = randomUUID();
    const code = randomCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    // A new attempt replaces any earlier open one, so "resend" invalidates the old code.
    await ctx.db.paymentChallenge.updateMany({
      where: { clientId: ctx.clientId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await ctx.db.paymentChallenge.create({
      data: {
        id: challengeId,
        gymId: ctx.gymId,
        clientId: ctx.clientId,
        kind: input.kind,
        payload: input as unknown as Prisma.InputJsonValue,
        codeHash: hashCode(challengeId, code),
        expiresAt,
      },
    });

    return {
      challengeId,
      expiresAt: expiresAt.toISOString(),
      ...(env.nodeEnv === 'production' ? {} : { demoCode: code }),
    };
  },

  async verify(
    ctx: TenantContext,
    challengeId: string,
    code: string
  ): Promise<PaymentChallengeResult> {
    const row = await ctx.db.paymentChallenge.findFirst({
      where: {
        id: challengeId,
        clientId: ctx.clientId ?? '',
        consumedAt: null,
      },
    });
    if (!row) {
      throw new NotFoundError(
        'Verification not found. Start the payment again.'
      );
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      throw new ValidationError(
        'The code has expired. Start the payment again.'
      );
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new ValidationError(
        'Too many wrong codes. Start the payment again.'
      );
    }

    if (!sameHash(row.codeHash, hashCode(row.id, code))) {
      await ctx.db.paymentChallenge.updateMany({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      const left = MAX_ATTEMPTS - (row.attempts + 1);
      throw new ValidationError(
        left > 0
          ? `Incorrect code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
          : 'Too many wrong codes. Start the payment again.'
      );
    }

    // The code works once: claiming the row first stops a replay or a double click paying twice.
    const claimed = await ctx.db.paymentChallenge.updateMany({
      where: { id: row.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new ValidationError('This verification was already used.');
    }

    const request = startChallengeSchema.parse(row.payload);
    if (request.kind === 'deposit') {
      return {
        kind: 'deposit',
        transaction: await balanceService.deposit(ctx, request.deposit, {
          verified: true,
        }),
      };
    }
    return {
      kind: 'membership',
      membership: await membershipService.subscribe(ctx, request.subscription, {
        verified: true,
      }),
    };
  },
};
