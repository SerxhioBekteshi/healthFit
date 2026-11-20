import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { createCredentialUser } from '@/auth/credentials';
import { env } from '@/config/env';
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueViolation,
} from '@/errors';
import { sendMail } from '@/mail';
import type { PublicContext, TenantContext } from '@/tenant/context';
import type {
  ClientSignupLookup,
  ClientSignupResult,
  GymJoinCode,
  GymJoinPreview,
} from '@gym/shared/types';
import type {
  ClientClaimValues,
  ClientSignupLookupValues,
  ClientSignupValues,
} from '@gym/shared/validation/client-signups';

const CODE_SECONDS = 60;
const RESEND_WAIT_SECONDS = 20;
const MAX_CODE_ATTEMPTS = 5;
const SECOND_MS = 1000;
// Outside production the code is always this one, so sign-up can be tried without a mail server.
const DEV_CODE = '111111';

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

const codeKey = (email: string): string => `client-signup-code:${email}`;

const badCode = (): ValidationError =>
  new ValidationError('The code is wrong or has expired.');

const badJoinLink = (): NotFoundError =>
  new NotFoundError('This join link is invalid or no longer active.');

interface CodeState {
  hash: string;
  attempts: number;
}

// The code lives in Better Auth's Verification table: only its hash is stored, it lives one minute,
// a few wrong guesses burn it, and a new one cannot be asked for right away (stops mail flooding).
const issueCode = async (
  db: PrismaClient,
  email: string,
  now: Date
): Promise<{ code: string; expiresAt: Date }> => {
  const last = await db.verification.findFirst({
    where: { identifier: codeKey(email) },
    orderBy: { createdAt: 'desc' },
  });
  if (
    last &&
    now.getTime() - last.createdAt.getTime() < RESEND_WAIT_SECONDS * SECOND_MS
  ) {
    throw new AppError(
      'Please wait a moment before asking for a new code.',
      429,
      'RATE_LIMITED'
    );
  }
  const code =
    env.nodeEnv === 'production'
      ? randomInt(0, 1_000_000).toString().padStart(6, '0')
      : DEV_CODE;
  const state: CodeState = { hash: sha256(code), attempts: 0 };
  const expiresAt = new Date(now.getTime() + CODE_SECONDS * SECOND_MS);
  await db.$transaction([
    db.verification.deleteMany({ where: { identifier: codeKey(email) } }),
    db.verification.create({
      data: {
        identifier: codeKey(email),
        value: JSON.stringify(state),
        expiresAt,
        createdAt: now,
      },
    }),
  ]);
  return { code, expiresAt };
};

// Outside production the code is the fixed one, so a mail server that is missing or not set up yet
// (for example an SMTP password still to be filled in) must not block signing up.
const sendCode = async (email: string, code: string): Promise<void> => {
  try {
    await sendMail({
      to: email,
      subject: 'Your HealthFIT verification code',
      text: `Your HealthFIT verification code is ${code}. It expires in 1 minute. If you did not ask for it, ignore this message.`,
    });
  } catch (error) {
    if (env.nodeEnv === 'production') {
      throw error;
    }
    console.warn(
      `[mail] could not send the verification code to ${email}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

const consumeCode = async (
  db: PrismaClient,
  email: string,
  code: string,
  now: Date
): Promise<void> => {
  const row = await db.verification.findFirst({
    where: { identifier: codeKey(email) },
    orderBy: { createdAt: 'desc' },
  });
  if (!row || row.expiresAt <= now) {
    throw badCode();
  }
  const state = JSON.parse(row.value) as CodeState;
  if (state.attempts >= MAX_CODE_ATTEMPTS) {
    throw badCode();
  }
  if (state.hash !== sha256(code)) {
    await db.verification.update({
      where: { id: row.id },
      data: {
        value: JSON.stringify({ ...state, attempts: state.attempts + 1 }),
      },
    });
    throw badCode();
  }
  await db.verification.deleteMany({ where: { identifier: codeKey(email) } });
};

const gymByJoinCode = async (db: PrismaClient, joinCode: string) => {
  const gym = await db.gym.findUnique({
    where: { joinCode },
    select: { id: true, name: true, country: true, isActive: true },
  });
  if (!gym || !gym.isActive) {
    throw badJoinLink();
  }
  return gym;
};

// Explicit exception to "services use ctx.db": the visitor has no session yet, so the login account
// and the gym are reached through the public context; gymId comes from the join code, never the body.
export const clientSignupService = {
  // Anonymous: tells the form whether the email is new, already registered, or a client a gym created.
  // For a new email and for a gym's client the verification code is emailed (again, when asked once
  // more); `expiresAt` tells the form how long it is good for.
  async lookup(
    ctx: PublicContext,
    input: ClientSignupLookupValues,
    now: Date = new Date()
  ): Promise<ClientSignupLookup> {
    const email = input.email.toLowerCase();
    const user = await ctx.db.user.findUnique({
      where: { email },
      include: {
        accounts: { where: { providerId: 'credential' }, select: { id: true } },
        client: { include: { gym: { select: { name: true } } } },
      },
    });
    if (
      user &&
      (user.accounts.length > 0 || user.role !== 'client' || !user.client)
    ) {
      return { status: 'registered', gymName: null, expiresAt: null };
    }

    const { code, expiresAt } = await issueCode(ctx.db, email, now);
    await sendCode(email, code);
    return {
      // A user row without a login is a client a gym added; anyone else is new.
      status: user ? 'gym_client' : 'new',
      gymName: user?.client?.gym.name ?? null,
      expiresAt: expiresAt.toISOString(),
    };
  },

  // Anonymous: a new member, once the code sent to their email is right. With a join code they become
  // a client of that gym, otherwise a community member who picks a gym later.
  async register(
    ctx: PublicContext,
    input: ClientSignupValues,
    now: Date = new Date()
  ): Promise<ClientSignupResult> {
    const email = input.email.toLowerCase();
    const gym = input.joinCode
      ? await gymByJoinCode(ctx.db, input.joinCode)
      : null;
    await consumeCode(ctx.db, email, input.code, now);
    const fullName = `${input.firstName} ${input.lastName}`;
    try {
      await ctx.db.$transaction(async (tx) => {
        const user = await createCredentialUser(tx, {
          name: fullName,
          email,
          password: input.password,
          role: 'client',
          gymId: gym?.id ?? null,
          phone: input.phone,
          gender: input.gender,
          country: input.country,
        });
        if (gym) {
          await tx.client.create({
            data: {
              gymId: gym.id,
              userId: user.id,
              fullName,
              email,
              phone: input.phone,
              gender: input.gender,
            },
          });
        }
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          'An account with this email already exists. Sign in instead.'
        );
      }
      throw error;
    }
    return { gymName: gym?.name ?? null };
  },

  // Anonymous: the client a gym created chooses their own password after proving the email with the code.
  async claim(
    ctx: PublicContext,
    input: ClientClaimValues,
    now: Date = new Date()
  ): Promise<ClientSignupResult> {
    const email = input.email.toLowerCase();
    await consumeCode(ctx.db, email, input.code, now);
    const passwordHash = await hashPassword(input.password);

    return ctx.db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        include: {
          accounts: {
            where: { providerId: 'credential' },
            select: { id: true },
          },
          client: { include: { gym: { select: { name: true } } } },
        },
      });
      if (
        !user ||
        user.role !== 'client' ||
        !user.client ||
        user.accounts.length > 0
      ) {
        throw badCode();
      }
      await tx.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: 'credential',
          password: passwordHash,
        },
      });
      return { gymName: user.client.gym.name };
    });
  },

  // Anonymous: shows which gym a join link belongs to.
  async joinPreview(
    ctx: PublicContext,
    joinCode: string
  ): Promise<GymJoinPreview> {
    const gym = await gymByJoinCode(ctx.db, joinCode);
    return { gymName: gym.name, gymCountry: gym.country };
  },

  async joinCode(ctx: TenantContext): Promise<GymJoinCode> {
    const gym = await ctx.db.gym.findFirst({
      where: { id: ctx.gymId },
      select: { joinCode: true },
    });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }
    return { joinCode: gym.joinCode };
  },

  // For a link that leaked: the old one stops working at once.
  async rotateJoinCode(ctx: TenantContext): Promise<GymJoinCode> {
    const joinCode = randomUUID();
    const result = await ctx.db.gym.updateMany({
      where: { id: ctx.gymId },
      data: { joinCode },
    });
    if (result.count === 0) {
      throw new NotFoundError('Gym not found.');
    }
    return { joinCode };
  },
};
