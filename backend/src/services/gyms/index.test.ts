import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { PlatformContext } from '@/tenant/context';
import { gymService } from '@/services/gyms';
import { gymAdminService } from '@/services/gym-admins';
import { DEFAULT_CLASSES } from '@/services/classes/defaults';
import { ConflictError, NotFoundError } from '@/errors';
import type { GymFormValues } from '@gym/shared/validation/gyms';

const prisma = new PrismaClient();

const ctx: PlatformContext = {
  user: {
    id: 'platform-owner',
    email: 'owner@test.dev',
    name: 'Owner',
    role: 'super_admin',
    gymId: null,
  },
  db: prisma,
};

const gymInput = (overrides: Partial<GymFormValues> = {}): GymFormValues => ({
  name: 'Test Gym',
  location: 'Tirana',
  country: 'AL',
  businessHours: 'Mon-Sun 06:00-22:00',
  opensAt: '06:00',
  closesAt: '22:00',
  timezone: 'Europe/Tirane',
  logoUrl: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  subdomain: '',
  customDomain: '',
  ...overrides,
});

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
});

afterAll(async () => {
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.$disconnect();
});

describe('gymService', () => {
  it('stores the country the gym operates in', async () => {
    const created = await gymService.create(ctx, gymInput({ country: 'IT' }));
    expect(created.country).toBe('IT');
    const moved = await gymService.update(
      ctx,
      created.id,
      gymInput({ country: 'GR' })
    );
    expect(moved.country).toBe('GR');
  });

  it('gives every new gym the default class timetable', async () => {
    const first = await gymService.create(ctx, gymInput({ name: 'One' }));
    const second = await gymService.create(ctx, gymInput({ name: 'Two' }));
    for (const gym of [first, second]) {
      const classes = await prisma.gymClass.findMany({
        where: { gymId: gym.id },
      });
      expect(classes.map((item) => item.name)).toEqual(
        expect.arrayContaining(['Abs', 'Aerobics', 'Zumba'])
      );
      expect(classes).toHaveLength(DEFAULT_CLASSES.length);
      expect(classes.every((item) => item.staffMemberId === null)).toBe(true);
    }
  });

  it('creates gyms with empty domains without unique collisions', async () => {
    const first = await gymService.create(ctx, gymInput({ name: 'One' }));
    const second = await gymService.create(ctx, gymInput({ name: 'Two' }));
    expect(first.subdomain).toBe('');
    expect(second.id).not.toBe(first.id);
  });

  it('rejects a duplicate subdomain', async () => {
    await gymService.create(ctx, gymInput({ subdomain: 'alpha' }));
    await expect(
      gymService.create(ctx, gymInput({ name: 'Other', subdomain: 'alpha' }))
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('toggles active status and reports missing gyms', async () => {
    const gym = await gymService.create(ctx, gymInput());
    const updated = await gymService.setActive(ctx, gym.id, false);
    expect(updated.isActive).toBe(false);
    await expect(
      gymService.setActive(ctx, 'missing', true)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('gymAdminService', () => {
  it('creates an admin user with a credential account scoped to the gym', async () => {
    const gym = await gymService.create(ctx, gymInput());
    const admin = await gymAdminService.create(ctx, {
      fullName: 'Ada Admin',
      email: 'Ada@Test.dev',
      password: 'Password123!',
      assignedGymId: gym.id,
    });

    expect(admin.email).toBe('ada@test.dev');
    expect(admin.assignedGymId).toBe(gym.id);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: admin.id },
      include: { accounts: true },
    });
    expect(user.role).toBe('gym_admin');
    expect(user.accounts[0]?.providerId).toBe('credential');
    expect(user.accounts[0]?.password).not.toBe('Password123!');

    const gyms = await gymService.list(ctx);
    expect(gyms[0]?.adminEmails).toEqual(['ada@test.dev']);
  });

  it('rejects a duplicate email and an unknown gym', async () => {
    const gym = await gymService.create(ctx, gymInput());
    const input = {
      fullName: 'Ada',
      email: 'ada@test.dev',
      password: 'Password123!',
      assignedGymId: gym.id,
    };
    await gymAdminService.create(ctx, input);
    await expect(gymAdminService.create(ctx, input)).rejects.toBeInstanceOf(
      ConflictError
    );
    await expect(
      gymAdminService.create(ctx, {
        ...input,
        email: 'other@test.dev',
        assignedGymId: 'missing',
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('only removes gym admins', async () => {
    const gym = await gymService.create(ctx, gymInput());
    const client = await prisma.user.create({
      data: {
        name: 'Client',
        email: 'client@test.dev',
        role: 'client',
        gymId: gym.id,
      },
    });
    await expect(gymAdminService.remove(ctx, client.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
