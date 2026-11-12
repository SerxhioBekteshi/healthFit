import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { clientService } from '@/services/clients';
import { ConflictError, NotFoundError } from '@/errors';

const prisma = new PrismaClient();

let gymAId: string;
let gymBId: string;

const contextFor = (gymId: string): TenantContext => ({
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

const clientInput = (email: string) => ({
  fullName: 'Test Client',
  email,
  phone: '+355690000000',
  gender: 'male' as const,
  password: 'Password123!',
});

const reset = async (): Promise<void> => {
  await prisma.client.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await reset();
  gymAId = (await prisma.gym.create({ data: { name: 'Gym A' } })).id;
  gymBId = (await prisma.gym.create({ data: { name: 'Gym B' } })).id;
});

afterAll(async () => {
  await reset();
  await prisma.$disconnect();
});

describe('clientService', () => {
  it('creates a client with a login account in the admin gym', async () => {
    const ctxA = contextFor(gymAId);
    const created = await clientService.create(
      ctxA,
      clientInput('Ann@Test.dev')
    );

    expect(created.gymId).toBe(gymAId);
    expect(created.email).toBe('ann@test.dev');

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'ann@test.dev' },
      include: { accounts: true },
    });
    expect(user.role).toBe('client');
    expect(user.gymId).toBe(gymAId);
    expect(user.accounts[0]?.providerId).toBe('credential');
  });

  it('rejects duplicate emails and leaves no orphan user', async () => {
    const ctxA = contextFor(gymAId);
    await clientService.create(ctxA, clientInput('dup@test.dev'));
    await expect(
      clientService.create(ctxA, clientInput('dup@test.dev'))
    ).rejects.toBeInstanceOf(ConflictError);
    expect(await prisma.user.count({ where: { email: 'dup@test.dev' } })).toBe(
      1
    );
  });

  it('keeps gyms isolated for list, get, update and status', async () => {
    const ctxA = contextFor(gymAId);
    const ctxB = contextFor(gymBId);
    const clientB = await clientService.create(ctxB, clientInput('b@test.dev'));
    await clientService.create(ctxA, clientInput('a@test.dev'));

    const listA = await clientService.list(ctxA);
    expect(listA.map((client) => client.email)).toEqual(['a@test.dev']);

    await expect(clientService.get(ctxA, clientB.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(
      clientService.update(ctxA, clientB.id, {
        fullName: 'Hacked',
        email: 'hacked@test.dev',
        phone: '+355690000000',
        gender: 'male',
      })
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      clientService.setActive(ctxA, clientB.id, false)
    ).rejects.toBeInstanceOf(NotFoundError);

    const untouched = await clientService.get(ctxB, clientB.id);
    expect(untouched.isActive).toBe(true);
    expect(untouched.fullName).toBe('Test Client');
  });

  it('syncs the login email and toggles status', async () => {
    const ctxA = contextFor(gymAId);
    const created = await clientService.create(
      ctxA,
      clientInput('old@test.dev')
    );
    const updated = await clientService.update(ctxA, created.id, {
      fullName: 'Renamed',
      email: 'new@test.dev',
      phone: '+355691111111',
      gender: 'female',
    });
    expect(updated.email).toBe('new@test.dev');
    expect(await prisma.user.count({ where: { email: 'new@test.dev' } })).toBe(
      1
    );

    const inactive = await clientService.setActive(ctxA, created.id, false);
    expect(inactive.isActive).toBe(false);
  });
});
