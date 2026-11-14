import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { PlatformContext } from '@/tenant/context';
import { gymService } from '@/services/gyms';
import { gymAdminService } from '@/services/gym-admins';
import { DEFAULT_CLASSES } from '@/services/classes/defaults';
import { DEFAULT_PROGRAMS } from '@/services/workout-programs/defaults';
import { ConflictError, NotFoundError, ValidationError } from '@/errors';
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
  it('gives every new gym the standard workout programs', async () => {
    const first = await gymService.create(ctx, gymInput({ name: 'One' }));
    const second = await gymService.create(ctx, gymInput({ name: 'Two' }));

    for (const gym of [first, second]) {
      const programs = await prisma.workoutProgram.findMany({
        where: { gymId: gym.id },
        include: { days: { include: { exercises: true } } },
        orderBy: { createdAt: 'asc' },
      });
      expect(programs.map((program) => program.name)).toEqual(
        DEFAULT_PROGRAMS.map((program) => program.name)
      );
      expect(programs.map((program) => program.level)).toEqual([
        'beginner',
        'intermediate',
        'advanced',
      ]);
      for (const program of programs) {
        expect(program.days).toHaveLength(program.sessionsPerWeek);
        expect(
          program.days.every(
            (day) => day.exercises.length > 0 && day.gymId === gym.id
          )
        ).toBe(true);
      }
      const squat = programs[0].days
        .flatMap((day) => day.exercises)
        .find((exercise) => exercise.name === 'Goblet Squat');
      expect(squat?.notes).toContain('Position:');
      expect(squat?.notes).toContain('Tip: Hold the weight at your chest');
    }

    // The owner can change them without touching another gym.
    await prisma.workoutProgram.deleteMany({ where: { gymId: first.id } });
    expect(
      await prisma.workoutProgram.count({ where: { gymId: second.id } })
    ).toBe(DEFAULT_PROGRAMS.length);
  });

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

  it('sets the currency from the country and never from the client', async () => {
    const albania = await gymService.create(ctx, gymInput({ country: 'AL' }));
    const germany = await gymService.create(
      ctx,
      gymInput({ name: 'DE', country: 'DE', timezone: 'Europe/Berlin' })
    );
    const britain = await gymService.create(
      ctx,
      gymInput({ name: 'GB', country: 'GB', timezone: 'Europe/London' })
    );
    expect(albania.currency).toBe('ALL');
    expect(germany.currency).toBe('EUR');
    expect(britain.currency).toBe('GBP');
    expect(germany.countryLocked).toBe(false);

    const moved = await gymService.update(
      ctx,
      albania.id,
      gymInput({ country: 'IT', timezone: 'Europe/Rome' })
    );
    expect(moved.currency).toBe('EUR');
  });

  it('locks the country once the gym holds prices or money', async () => {
    const gym = await gymService.create(ctx, gymInput({ country: 'AL' }));
    await prisma.membershipPlan.create({
      data: {
        gymId: gym.id,
        name: 'Monthly',
        type: 'monthly',
        durationDays: 30,
        price: '3000.00',
      },
    });

    expect((await gymService.list(ctx))[0]?.countryLocked).toBe(true);
    await expect(
      gymService.update(ctx, gym.id, gymInput({ country: 'DE' }))
    ).rejects.toBeInstanceOf(ValidationError);

    // Other details stay editable while the country is unchanged.
    const renamed = await gymService.update(
      ctx,
      gym.id,
      gymInput({ name: 'Renamed' })
    );
    expect(renamed.name).toBe('Renamed');
    expect(renamed.currency).toBe('ALL');
    expect(renamed.countryLocked).toBe(true);
    await prisma.membershipPlan.deleteMany({ where: { gymId: gym.id } });
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
