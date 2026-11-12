import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { classService } from '@/services/classes';
import { staffMemberService } from '@/services/staff-members';
import { NotFoundError } from '@/errors';
import type { ClassFormValues } from '@gym/shared/validation/classes';

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

const clientContext = (gymId: string): TenantContext => ({
  ...adminContext(gymId),
  role: 'client',
  clientId: 'client-1',
});

const classInput = (overrides: Partial<ClassFormValues>): ClassFormValues => ({
  name: 'Abs',
  description: '',
  weekdays: [1, 3],
  startTime: '18:00',
  endTime: '19:00',
  staffMemberId: '',
  ...overrides,
});

const wipe = async (): Promise<void> => {
  await prisma.gymClass.deleteMany();
  await prisma.staffMember.deleteMany();
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

describe('classService', () => {
  it('puts a staff member in front of a class and shows it to members', async () => {
    const admin = adminContext(gymAId);
    const ana = await staffMemberService.create(admin, {
      fullName: 'Ana',
      specialty: 'Abs',
    });
    const created = await classService.create(
      admin,
      classInput({ staffMemberId: ana.id, weekdays: [3, 1, 3] })
    );
    expect(created.weekdays).toEqual([1, 3]);
    expect(created.staffMemberName).toBe('Ana');

    const hidden = await classService.create(
      admin,
      classInput({ name: 'Hidden', startTime: '07:00', endTime: '08:00' })
    );
    await classService.setActive(admin, hidden.id, false);

    const forMember = await classService.list(clientContext(gymAId));
    expect(forMember.map((item) => item.name)).toEqual(['Abs']);
    expect(await classService.list(admin)).toHaveLength(2);
  });

  it('does not let one instructor teach two overlapping classes', async () => {
    const admin = adminContext(gymAId);
    const ana = await staffMemberService.create(admin, {
      fullName: 'Ana',
      specialty: '',
    });
    await classService.create(admin, classInput({ staffMemberId: ana.id }));

    await expect(
      classService.create(
        admin,
        classInput({
          name: 'Aerobics',
          staffMemberId: ana.id,
          weekdays: [3, 5],
          startTime: '18:30',
          endTime: '19:30',
        })
      )
    ).rejects.toThrow(/Ana already teaches Abs/);

    // Back to back, another day, or another instructor are fine.
    await expect(
      classService.create(
        admin,
        classInput({
          name: 'Aerobics',
          staffMemberId: ana.id,
          startTime: '19:00',
          endTime: '20:00',
        })
      )
    ).resolves.toBeTruthy();
    await expect(
      classService.create(
        admin,
        classInput({ name: 'Yoga', staffMemberId: ana.id, weekdays: [2] })
      )
    ).resolves.toBeTruthy();
    await expect(
      classService.create(admin, classInput({ name: 'Zumba' }))
    ).resolves.toBeTruthy();
  });

  it('can edit a class without clashing with itself', async () => {
    const admin = adminContext(gymAId);
    const ana = await staffMemberService.create(admin, {
      fullName: 'Ana',
      specialty: '',
    });
    const created = await classService.create(
      admin,
      classInput({ staffMemberId: ana.id })
    );
    const updated = await classService.update(
      admin,
      created.id,
      classInput({ staffMemberId: ana.id, endTime: '19:30' })
    );
    expect(updated.endTime).toBe('19:30');
  });

  it('only assigns active staff of the same gym', async () => {
    const admin = adminContext(gymAId);
    const other = await staffMemberService.create(adminContext(gymBId), {
      fullName: 'Other',
      specialty: '',
    });
    await expect(
      classService.create(admin, classInput({ staffMemberId: other.id }))
    ).rejects.toBeInstanceOf(NotFoundError);

    const ana = await staffMemberService.create(admin, {
      fullName: 'Ana',
      specialty: '',
    });
    await staffMemberService.setActive(admin, ana.id, false);
    await expect(
      classService.create(admin, classInput({ staffMemberId: ana.id }))
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('keeps classes of other gyms out of reach', async () => {
    const created = await classService.create(
      adminContext(gymAId),
      classInput({})
    );
    await expect(
      classService.remove(adminContext(gymBId), created.id)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await classService.list(adminContext(gymBId))).toHaveLength(0);
    await expect(
      classService.update(adminContext(gymBId), created.id, classInput({}))
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
