import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createTenantDb } from '@/tenant/scopedDb';

const prisma = new PrismaClient();

let gymAId: string;
let gymBId: string;
let clientBId: string;

beforeAll(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');

  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();

  const gymA = await prisma.gym.create({ data: { name: 'Gym A' } });
  const gymB = await prisma.gym.create({ data: { name: 'Gym B' } });
  gymAId = gymA.id;
  gymBId = gymB.id;

  await prisma.client.create({
    data: { gymId: gymAId, fullName: 'Client A', email: 'a@test.dev' },
  });
  const clientB = await prisma.client.create({
    data: { gymId: gymBId, fullName: 'Client B', email: 'b@test.dev' },
  });
  clientBId = clientB.id;
});

afterAll(async () => {
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.$disconnect();
});

describe('tenant scoped db', () => {
  it('lists only the current gym rows', async () => {
    const db = createTenantDb(prisma, gymAId);
    const clients = await db.client.findMany();
    expect(clients).toHaveLength(1);
    expect(clients.every((client) => client.gymId === gymAId)).toBe(true);
  });

  it('cannot read another gym row by id', async () => {
    const db = createTenantDb(prisma, gymAId);
    expect(await db.client.findFirst({ where: { id: clientBId } })).toBeNull();
    expect(await db.client.findUnique({ where: { id: clientBId } })).toBeNull();
    expect(await db.client.count({ where: { gymId: gymBId } })).toBe(1);
    const spoofed = await db.client.findMany({ where: { gymId: gymBId } });
    expect(spoofed.every((client) => client.gymId === gymAId)).toBe(true);
  });

  it('cannot update or delete another gym row', async () => {
    const db = createTenantDb(prisma, gymAId);
    const updated = await db.client.updateMany({
      where: { id: clientBId },
      data: { fullName: 'Hacked' },
    });
    const deleted = await db.client.deleteMany({ where: { id: clientBId } });
    expect(updated.count).toBe(0);
    expect(deleted.count).toBe(0);

    const untouched = await prisma.client.findUnique({
      where: { id: clientBId },
    });
    expect(untouched?.fullName).toBe('Client B');
  });

  it('forces gymId on create even when another gym is supplied', async () => {
    const db = createTenantDb(prisma, gymAId);
    const created = await db.client.create({
      data: { gymId: gymBId, fullName: 'New', email: 'new@test.dev' },
    });
    expect(created.gymId).toBe(gymAId);
  });

  it('cannot move a row to another gym through update', async () => {
    const db = createTenantDb(prisma, gymAId);
    const own = await db.client.findFirstOrThrow({
      where: { email: 'a@test.dev' },
    });
    const updated = await db.client.update({
      where: { id: own.id },
      data: { gymId: gymBId },
    });
    expect(updated.gymId).toBe(gymAId);
  });

  it('only exposes its own gym record and cannot delete it', async () => {
    const db = createTenantDb(prisma, gymAId);
    const gyms = await db.gym.findMany();
    expect(gyms.map((gym) => gym.id)).toEqual([gymAId]);
    await expect(db.gym.delete({ where: { id: gymAId } })).rejects.toThrow();
  });

  it('blocks auth tables', async () => {
    const db = createTenantDb(prisma, gymAId);
    await expect(db.session.findMany()).rejects.toThrow();
    await expect(db.account.findMany()).rejects.toThrow();
  });

  it('keeps the scope inside interactive transactions', async () => {
    const db = createTenantDb(prisma, gymAId);
    await db.$transaction(async (tx) => {
      expect(
        await tx.client.findFirst({ where: { id: clientBId } })
      ).toBeNull();
      expect(
        (
          await tx.client.updateMany({
            where: { id: clientBId },
            data: { fullName: 'Hacked' },
          })
        ).count
      ).toBe(0);
      await expect(tx.session.findMany()).rejects.toThrow();
    });
  });
});
