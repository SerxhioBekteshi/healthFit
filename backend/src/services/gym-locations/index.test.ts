import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { gymLocationService } from '@/services/gym-locations';
import { NotFoundError, ValidationError } from '@/errors';
import { gymLocationFormSchema } from '@gym/shared/validation/gym-locations';

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

const input = (name: string) => ({
  name,
  address: `${name} street 1`,
  phone: '',
  latitude: 41.3275,
  longitude: 19.8187,
  mapUrl: '',
});

const wipe = async (): Promise<void> => {
  await prisma.gymLocation.deleteMany();
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

describe('gymLocationService', () => {
  it('stores the coordinates and the map link the owner picked', async () => {
    const admin = adminContext(gymAId);
    const created = await gymLocationService.create(admin, {
      ...input('Center'),
      latitude: 41.33,
      longitude: 19.82,
      mapUrl: 'https://maps.app.goo.gl/abc123',
    });
    expect(created).toMatchObject({
      latitude: 41.33,
      longitude: 19.82,
      mapUrl: 'https://maps.app.goo.gl/abc123',
    });

    const moved = await gymLocationService.update(admin, created.id, {
      ...input('Center'),
      latitude: 41.4,
      longitude: 19.9,
    });
    expect(moved).toMatchObject({
      latitude: 41.4,
      longitude: 19.9,
      mapUrl: '',
    });
  });

  it('rejects missing coordinates and unsafe map links', () => {
    const valid = input('Center');
    expect(gymLocationFormSchema.safeParse(valid).success).toBe(true);
    expect(
      gymLocationFormSchema.safeParse({ ...valid, latitude: undefined }).success
    ).toBe(false);
    expect(
      gymLocationFormSchema.safeParse({ ...valid, latitude: 91 }).success
    ).toBe(false);
    expect(
      gymLocationFormSchema.safeParse({ ...valid, longitude: -181 }).success
    ).toBe(false);
    for (const mapUrl of [
      'javascript:alert(1)',
      'http://maps.test',
      'not a url',
    ]) {
      expect(
        gymLocationFormSchema.safeParse({ ...valid, mapUrl }).success
      ).toBe(false);
    }
  });

  it('lets the owner add locations and shows members only the active ones', async () => {
    const admin = adminContext(gymAId);
    const first = await gymLocationService.create(admin, input('Center'));
    const second = await gymLocationService.create(admin, input('North'));
    await gymLocationService.setActive(admin, second.id, false);

    expect(
      (await gymLocationService.list(admin)).map((item) => item.name)
    ).toEqual(['Center', 'North']);
    expect(
      (await gymLocationService.list(clientContext(gymAId))).map(
        (item) => item.id
      )
    ).toEqual([first.id]);
  });

  it('keeps one location active', async () => {
    const admin = adminContext(gymAId);
    const only = await gymLocationService.create(admin, input('Center'));
    await expect(
      gymLocationService.setActive(admin, only.id, false)
    ).rejects.toThrow(ValidationError);
  });

  it('never touches another gym', async () => {
    const a = await gymLocationService.create(
      adminContext(gymAId),
      input('Center')
    );
    const adminB = adminContext(gymBId);

    expect(await gymLocationService.list(adminB)).toEqual([]);
    await expect(
      gymLocationService.update(adminB, a.id, input('Hacked'))
    ).rejects.toThrow(NotFoundError);
    await expect(
      gymLocationService.setActive(adminB, a.id, false)
    ).rejects.toThrow(NotFoundError);
  });

  it('picks the check-in location', async () => {
    const admin = adminContext(gymAId);
    expect(await gymLocationService.resolveForCheckIn(admin)).toBeNull();

    const center = await gymLocationService.create(admin, input('Center'));
    expect((await gymLocationService.resolveForCheckIn(admin))?.id).toBe(
      center.id
    );

    const north = await gymLocationService.create(admin, input('North'));
    await expect(gymLocationService.resolveForCheckIn(admin)).rejects.toThrow(
      /Choose the gym location/
    );
    expect(
      (await gymLocationService.resolveForCheckIn(admin, north.id))?.id
    ).toBe(north.id);

    const foreign = await gymLocationService.create(
      adminContext(gymBId),
      input('Elsewhere')
    );
    await expect(
      gymLocationService.resolveForCheckIn(admin, foreign.id)
    ).rejects.toThrow(/Choose one of the gym locations/);
  });
});
