import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from 'better-auth/crypto';
import { ConflictError, NotFoundError } from '@/errors';
import { signupRequestService } from '@/services/signup-requests';
import type { PlatformContext } from '@/tenant/context';
import type { SignupRequestValues } from '@gym/shared/validation/signup-requests';

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
const visitor = { db: prisma };

const request = (
  overrides: Partial<SignupRequestValues> = {}
): SignupRequestValues => ({
  ownerName: 'Ana Owner',
  email: 'Ana@Gym.test',
  phone: '+355 69 123 4567',
  password: 'Password123!',
  gymName: 'Ana Fitness',
  country: 'IT',
  location: 'Rome',
  address: 'Via Roma 1',
  locationsCount: 2,
  notes: 'Two gyms in Rome.',
  ...overrides,
});

const wipe = async (): Promise<void> => {
  await prisma.signupRequest.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('signupRequestService', () => {
  it('stores an application without creating an account or exposing the password', async () => {
    await signupRequestService.submit(visitor, request());

    const [listed] = await signupRequestService.list(platform);
    expect(listed).toMatchObject({
      email: 'ana@gym.test',
      gymName: 'Ana Fitness',
      country: 'IT',
      locationsCount: 2,
      status: 'pending',
      gymId: null,
    });
    expect(JSON.stringify(listed)).not.toContain('Password123');
    expect(await prisma.user.count()).toBe(0);

    const stored = await prisma.signupRequest.findFirstOrThrow();
    expect(stored.passwordHash).not.toBe('Password123!');
    expect(
      await verifyPassword({
        hash: stored.passwordHash,
        password: 'Password123!',
      })
    ).toBe(true);
  });

  it('refuses a second pending request or an existing account for the same email', async () => {
    await signupRequestService.submit(visitor, request());
    await expect(
      signupRequestService.submit(visitor, request({ email: 'ANA@gym.test' }))
    ).rejects.toBeInstanceOf(ConflictError);

    await prisma.user.create({
      data: { name: 'Taken', email: 'taken@gym.test', role: 'client' },
    });
    await expect(
      signupRequestService.submit(visitor, request({ email: 'taken@gym.test' }))
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('creates the gym, its location and the admin login on approval', async () => {
    await signupRequestService.submit(visitor, request());
    const [pending] = await signupRequestService.list(platform);

    const approved = await signupRequestService.approve(platform, pending.id);
    expect(approved.status).toBe('approved');
    expect(approved.gymId).not.toBeNull();

    const gym = await prisma.gym.findUniqueOrThrow({
      where: { id: approved.gymId ?? '' },
    });
    expect(gym).toMatchObject({
      name: 'Ana Fitness',
      country: 'IT',
      currency: 'EUR',
      timezone: 'Europe/Rome',
      contactEmail: 'ana@gym.test',
    });
    expect(await prisma.gymLocation.count({ where: { gymId: gym.id } })).toBe(
      1
    );
    expect(
      await prisma.gymClass.count({ where: { gymId: gym.id } })
    ).toBeGreaterThan(0);
    expect(
      await prisma.workoutProgram.count({ where: { gymId: gym.id } })
    ).toBeGreaterThan(0);

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: 'ana@gym.test' },
      include: { accounts: true },
    });
    expect(admin).toMatchObject({ role: 'gym_admin', gymId: gym.id });
    expect(
      await verifyPassword({
        hash: admin.accounts[0].password ?? '',
        password: 'Password123!',
      })
    ).toBe(true);
  });

  it('reviews a request only once', async () => {
    await signupRequestService.submit(visitor, request());
    const [pending] = await signupRequestService.list(platform);

    await signupRequestService.approve(platform, pending.id);
    await expect(
      signupRequestService.approve(platform, pending.id)
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      signupRequestService.reject(platform, pending.id, 'Too late')
    ).rejects.toBeInstanceOf(ConflictError);
    expect(await prisma.gym.count()).toBe(1);
  });

  it('rejects with a note, creates nothing and lets the owner apply again', async () => {
    await signupRequestService.submit(visitor, request());
    const [pending] = await signupRequestService.list(platform);

    const rejected = await signupRequestService.reject(
      platform,
      pending.id,
      'Could not verify the gym.'
    );
    expect(rejected).toMatchObject({
      status: 'rejected',
      reviewNote: 'Could not verify the gym.',
    });
    expect(await prisma.gym.count()).toBe(0);
    expect(await prisma.user.count()).toBe(0);

    await signupRequestService.submit(
      visitor,
      request({ gymName: 'Ana Fitness 2' })
    );
    expect(await signupRequestService.list(platform)).toHaveLength(2);
  });

  it('does not approve when the email became an account meanwhile', async () => {
    await signupRequestService.submit(visitor, request());
    const [pending] = await signupRequestService.list(platform);
    await prisma.user.create({
      data: { name: 'Same', email: 'ana@gym.test', role: 'client' },
    });

    await expect(
      signupRequestService.approve(platform, pending.id)
    ).rejects.toBeInstanceOf(ConflictError);
    expect(await prisma.gym.count()).toBe(0);
    expect((await signupRequestService.list(platform))[0].status).toBe(
      'pending'
    );
  });

  it('reports an unknown request', async () => {
    await expect(
      signupRequestService.approve(platform, 'missing')
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
