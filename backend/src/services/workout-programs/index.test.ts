import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { workoutProgramService } from '@/services/workout-programs';
import { NotFoundError } from '@/errors';
import {
  workoutProgramInputSchema,
  type WorkoutProgramInput,
} from '@gym/shared/validation/workout-programs';

const prisma = new PrismaClient();

let gymAId: string;
let gymBId: string;

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

const exercise = (name: string, overrides = {}) => ({
  name,
  icon: 'barbell',
  sets: 3,
  reps: 10,
  weight: 22.5,
  restSeconds: 90,
  notes: '',
  ...overrides,
});

const program = (
  overrides: Partial<WorkoutProgramInput> = {}
): WorkoutProgramInput => ({
  name: 'Starter',
  level: 'beginner',
  description: 'Three days',
  sessionsPerWeek: 2,
  days: [
    { focus: 'Push', exercises: [exercise('Bench'), exercise('Press')] },
    { focus: '', exercises: [exercise('Squat')] },
  ],
  ...overrides,
});

const wipe = async (): Promise<void> => {
  await prisma.exercise.deleteMany();
  await prisma.workoutDay.deleteMany();
  await prisma.workoutProgram.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  gymAId = (await prisma.gym.create({ data: { name: 'A' } })).id;
  gymBId = (await prisma.gym.create({ data: { name: 'B' } })).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('workoutProgramService', () => {
  it('stores days and exercises in order, scoped to the gym', async () => {
    const created = await workoutProgramService.create(
      adminContext(gymAId),
      program()
    );

    expect(created.days.map((day) => day.dayNumber)).toEqual([1, 2]);
    expect(created.days[1]?.focus).toBe('Day 2');
    expect(created.days[0]?.exercises.map((e) => e.name)).toEqual([
      'Bench',
      'Press',
    ]);
    expect(created.days[0]?.exercises[0]?.weight).toBe(22.5);

    // Nested rows carry the gym too, so they cannot leak across tenants.
    expect(
      await prisma.workoutDay.count({ where: { gymId: { not: gymAId } } })
    ).toBe(0);
    expect(
      await prisma.exercise.count({ where: { gymId: { not: gymAId } } })
    ).toBe(0);
  });

  it('replaces days and exercises on update without leaving orphans', async () => {
    const ctx = adminContext(gymAId);
    const created = await workoutProgramService.create(ctx, program());

    const updated = await workoutProgramService.update(
      ctx,
      created.id,
      program({
        name: 'Renamed',
        sessionsPerWeek: 1,
        days: [{ focus: 'Full body', exercises: [exercise('Deadlift')] }],
      })
    );

    expect(updated.name).toBe('Renamed');
    expect(updated.days).toHaveLength(1);
    expect(updated.days[0]?.exercises.map((e) => e.name)).toEqual(['Deadlift']);
    expect(await prisma.workoutDay.count()).toBe(1);
    expect(await prisma.exercise.count()).toBe(1);
  });

  it('removes a program together with its days and exercises', async () => {
    const ctx = adminContext(gymAId);
    const created = await workoutProgramService.create(ctx, program());
    await workoutProgramService.remove(ctx, created.id);

    expect(await prisma.workoutProgram.count()).toBe(0);
    expect(await prisma.workoutDay.count()).toBe(0);
    expect(await prisma.exercise.count()).toBe(0);
  });

  it('is isolated between gyms', async () => {
    const created = await workoutProgramService.create(
      adminContext(gymAId),
      program()
    );
    const ctxB = adminContext(gymBId);

    expect(await workoutProgramService.list(ctxB)).toHaveLength(0);
    await expect(
      workoutProgramService.update(
        ctxB,
        created.id,
        program({ name: 'Hacked' })
      )
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      workoutProgramService.remove(ctxB, created.id)
    ).rejects.toBeInstanceOf(NotFoundError);

    const untouched = await workoutProgramService.list(adminContext(gymAId));
    expect(untouched[0]?.name).toBe('Starter');
    expect(untouched[0]?.days).toHaveLength(2);
  });
});

describe('workoutProgramInputSchema', () => {
  it('requires one day per weekly session and sane exercise values', () => {
    expect(
      workoutProgramInputSchema.safeParse(program({ sessionsPerWeek: 3 }))
        .success
    ).toBe(false);
    expect(
      workoutProgramInputSchema.safeParse(
        program({
          days: [
            { focus: '', exercises: [exercise('X', { sets: 0 })] },
            { focus: '', exercises: [] },
          ],
        })
      ).success
    ).toBe(false);
    expect(workoutProgramInputSchema.safeParse(program()).success).toBe(true);
  });
});
