import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from 'better-auth/crypto';
import { ConflictError, NotFoundError, ValidationError } from '@/errors';
import { clientSignupService } from '@/services/client-signups';
import { clientService } from '@/services/clients';
import { communityService } from '@/services/community';
import type { CommunityContext, TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';

const prisma = new PrismaClient();
const visitor = { db: prisma };

let gymAId: string;
let gymBId: string;
let joinCodeA: string;

const adminContext = (gymId: string): TenantContext => ({
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

const signup = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'Mira',
  lastName: 'Hoxha',
  email: 'Mira@Test.dev',
  phone: '+355 69 000 3333',
  gender: 'female' as const,
  country: 'AL' as const,
  password: 'Password123!',
  // Outside production the emailed code is always this one.
  code: '111111',
  ...overrides,
});

// What the form does: ask for the code by email, then register with it.
const register = async (overrides: Record<string, unknown> = {}) => {
  const input = signup(overrides);
  await clientSignupService.lookup(visitor, { email: input.email });
  return clientSignupService.register(visitor, input);
};

const wipe = async (): Promise<void> => {
  await prisma.verification.deleteMany();
  await prisma.clientInvite.deleteMany();
  await prisma.client.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  const gymA = await prisma.gym.create({
    data: { name: 'Gym A', country: 'IT' },
  });
  gymAId = gymA.id;
  joinCodeA = gymA.joinCode;
  gymBId = (await prisma.gym.create({ data: { name: 'Gym B' } })).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('join link', () => {
  it('shows the gym and works for ever until the owner replaces it', async () => {
    const admin = adminContext(gymAId);
    expect((await clientSignupService.joinCode(admin)).joinCode).toBe(
      joinCodeA
    );
    expect(await clientSignupService.joinPreview(visitor, joinCodeA)).toEqual({
      gymName: 'Gym A',
      gymCountry: 'IT',
    });

    const rotated = await clientSignupService.rotateJoinCode(admin);
    expect(rotated.joinCode).not.toBe(joinCodeA);
    await expect(
      clientSignupService.joinPreview(visitor, joinCodeA)
    ).rejects.toBeInstanceOf(NotFoundError);
    // The other gym keeps its own code.
    expect(
      (await clientSignupService.joinCode(adminContext(gymBId))).joinCode
    ).not.toBe(rotated.joinCode);
  });

  it('is not shown for an inactive gym', async () => {
    await prisma.gym.update({
      where: { id: gymAId },
      data: { isActive: false },
    });
    await expect(
      clientSignupService.joinPreview(visitor, joinCodeA)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('client sign-up', () => {
  it('makes a member of the gym whose link they used', async () => {
    const result = await register({ joinCode: joinCodeA });
    expect(result.gymName).toBe('Gym A');

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'mira@test.dev' },
      include: { client: true, accounts: true },
    });
    expect(user.role).toBe('client');
    expect(user.gymId).toBe(gymAId);
    expect(user.client?.gymId).toBe(gymAId);
    expect(user.client?.fullName).toBe('Mira Hoxha');
    expect(user.client?.gender).toBe('female');
    expect(
      await verifyPassword({
        hash: user.accounts[0]?.password ?? '',
        password: 'Password123!',
      })
    ).toBe(true);
  });

  it('takes gymId from the join code, never from the request', async () => {
    await register({ joinCode: joinCodeA, gymId: gymBId });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'mira@test.dev' },
    });
    expect(user.gymId).toBe(gymAId);
  });

  it('puts a visitor without a link in the community, without a client row', async () => {
    const result = await register();
    expect(result.gymName).toBeNull();

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'mira@test.dev' },
    });
    expect(user.gymId).toBeNull();
    expect(user.phone).toBe('+355 69 000 3333');
    expect(user.country).toBe('AL');
    expect(await prisma.client.count()).toBe(0);
  });

  it('rejects an unknown link and an email that already has an account', async () => {
    await expect(
      clientSignupService.register(visitor, signup({ joinCode: 'nope' }))
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await prisma.user.count()).toBe(0);

    await register();
    // A registered email is never sent a code, so a second sign-up cannot be verified.
    await expect(register()).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.user.count()).toBe(1);
  });

  it('needs the emailed code: none asked for, a wrong one, or an expired one', async () => {
    await expect(
      clientSignupService.register(visitor, signup())
    ).rejects.toBeInstanceOf(ValidationError);

    const issued = new Date('2026-11-01T10:00:00Z');
    await clientSignupService.lookup(
      visitor,
      { email: 'mira@test.dev' },
      issued
    );
    await expect(
      clientSignupService.register(
        visitor,
        signup({ code: '000000' }),
        new Date('2026-11-01T10:00:30Z')
      )
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      clientSignupService.register(
        visitor,
        signup(),
        new Date('2026-11-01T10:01:01Z')
      )
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.user.count()).toBe(0);

    await clientSignupService.register(
      visitor,
      signup(),
      new Date('2026-11-01T10:00:59Z')
    );
    expect(await prisma.user.count()).toBe(1);
  });
});

describe('email lookup and claiming a gym client', () => {
  const createdByGym = () =>
    clientService.create(adminContext(gymBId), {
      fullName: 'Ilir Invited',
      email: 'ilir@test.dev',
      phone: '+355 69 000 1111',
      gender: 'male',
    });

  it('tells new, registered and gym-created emails apart', async () => {
    const issued = new Date('2026-11-01T10:00:00Z');
    expect(
      await clientSignupService.lookup(
        visitor,
        { email: 'fresh@test.dev' },
        issued
      )
    ).toEqual({
      status: 'new',
      gymName: null,
      expiresAt: '2026-11-01T10:01:00.000Z',
    });

    await createdByGym();
    const found = await clientSignupService.lookup(visitor, {
      email: 'Ilir@Test.dev',
    });
    expect(found.status).toBe('gym_client');
    expect(found.gymName).toBe('Gym B');
    expect(found.expiresAt).not.toBeNull();

    await register();
    expect(
      await clientSignupService.lookup(visitor, { email: 'mira@test.dev' })
    ).toEqual({ status: 'registered', gymName: null, expiresAt: null });
    await prisma.user.create({
      data: { name: 'Owner', email: 'owner@test.dev', role: 'gym_admin' },
    });
    // An existing owner account is reported like any other registered email.
    expect(
      await clientSignupService.lookup(visitor, { email: 'owner@test.dev' })
    ).toEqual({ status: 'registered', gymName: null, expiresAt: null });
  });

  it('only sends a new code after a short wait', async () => {
    const first = new Date('2026-11-01T10:00:00Z');
    const lookup = (now: Date) =>
      clientSignupService.lookup(visitor, { email: 'fresh@test.dev' }, now);

    await lookup(first);
    await expect(
      lookup(new Date('2026-11-01T10:00:10Z'))
    ).rejects.toMatchObject({ status: 429 });
    const again = await lookup(new Date('2026-11-01T10:00:25Z'));
    expect(again.expiresAt).toBe('2026-11-01T10:01:25.000Z');
    expect(await prisma.verification.count()).toBe(1);
  });

  it('lets the gym client set a password only with the right code, once', async () => {
    await createdByGym();
    await clientSignupService.lookup(visitor, { email: 'ilir@test.dev' });
    const claim = (code: string) =>
      clientSignupService.claim(visitor, {
        email: 'ilir@test.dev',
        code,
        password: 'Password123!',
      });

    await expect(claim('000000')).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.account.count()).toBe(0);

    expect((await claim('111111')).gymName).toBe('Gym B');
    expect(await prisma.account.count()).toBe(1);
    await expect(claim('111111')).rejects.toBeInstanceOf(ValidationError);
  });

  it('burns the code after too many wrong guesses', async () => {
    await createdByGym();
    await clientSignupService.lookup(visitor, { email: 'ilir@test.dev' });
    const attempt = (code: string) =>
      clientSignupService.claim(visitor, {
        email: 'ilir@test.dev',
        code,
        password: 'Password123!',
      });

    for (let index = 0; index < 5; index += 1) {
      await expect(attempt('000000')).rejects.toBeInstanceOf(ValidationError);
    }
    await expect(attempt('111111')).rejects.toBeInstanceOf(ValidationError);
    expect(await prisma.account.count()).toBe(0);
  });

  it('rejects an expired code', async () => {
    await createdByGym();
    await clientSignupService.lookup(
      visitor,
      { email: 'ilir@test.dev' },
      new Date('2026-11-01T10:00:00Z')
    );
    await expect(
      clientSignupService.claim(
        visitor,
        { email: 'ilir@test.dev', code: '111111', password: 'Password123!' },
        new Date('2026-11-01T10:01:01Z')
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('community', () => {
  const memberContext = async (): Promise<CommunityContext> => {
    await register();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'mira@test.dev' },
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'client',
        gymId: null,
      },
      db: prisma,
    };
  };

  it('lists active gyms of the member country first, or all on request', async () => {
    await prisma.gym.create({
      data: { name: 'Closed gym', isActive: false },
    });
    const ctx = await memberContext();

    // The member signed up in Albania; Gym A is Italian, Gym B Albanian.
    const own = await communityService.listGyms(ctx);
    expect(own.country).toBe('AL');
    expect(own.gyms.map((gym) => gym.name)).toEqual(['Gym B']);

    const italy = await communityService.listGyms(ctx, { country: 'IT' });
    expect(italy.country).toBe('IT');
    expect(italy.gyms.map((gym) => gym.name)).toEqual(['Gym A']);

    const all = await communityService.listGyms(ctx, { country: 'all' });
    expect(all.country).toBeNull();
    expect(all.gyms.map((gym) => gym.name)).toEqual(['Gym A', 'Gym B']);
  });

  it('shows every gym when the member has no country', async () => {
    const ctx = await memberContext();
    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { country: null },
    });
    const result = await communityService.listGyms(ctx);
    expect(result.country).toBeNull();
    expect(result.gyms).toHaveLength(2);
  });

  it('lets a member pick a gym and become its client with their details', async () => {
    const ctx = await memberContext();
    const result = await communityService.join(ctx, gymBId);
    expect(result).toEqual({ gymId: gymBId, gymName: 'Gym B' });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      include: { client: true },
    });
    expect(user.gymId).toBe(gymBId);
    expect(user.client).toMatchObject({
      gymId: gymBId,
      fullName: 'Mira Hoxha',
      phone: '+355 69 000 3333',
      gender: 'female',
    });
  });

  it('cannot join twice or join an unknown or inactive gym', async () => {
    const ctx = await memberContext();
    await expect(communityService.join(ctx, 'missing')).rejects.toBeInstanceOf(
      NotFoundError
    );
    await prisma.gym.update({
      where: { id: gymAId },
      data: { isActive: false },
    });
    await expect(communityService.join(ctx, gymAId)).rejects.toBeInstanceOf(
      NotFoundError
    );

    await communityService.join(ctx, gymBId);
    await expect(communityService.join(ctx, gymBId)).rejects.toBeInstanceOf(
      ConflictError
    );
    expect(await prisma.client.count()).toBe(1);
  });
});
