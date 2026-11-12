import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { attendanceService } from '@/services/attendance';
import { gymClosureService } from '@/services/gym-closures';
import { gymLocationService } from '@/services/gym-locations';
import { NotFoundError } from '@/errors';

const prisma = new PrismaClient();

// 11:00 local time in Europe/Tirane (UTC+1 in November).
const NOW = new Date('2026-11-02T10:00:00Z');

let gymAId: string;
let gymBId: string;
let clientAId: string;
let clientBId: string;
let membershipAId: string;

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

const clientContext = (gymId: string, clientId: string): TenantContext => ({
  ...adminContext(gymId),
  user: {
    id: `user-${clientId}`,
    email: 'c@test.dev',
    name: 'Client',
    role: 'client',
    gymId,
  },
  role: 'client',
  clientId,
});

const makeClient = (gymId: string, email: string) =>
  prisma.client.create({ data: { gymId, fullName: email, email } });

const makeMembership = (
  gymId: string,
  clientId: string,
  overrides: Record<string, unknown> = {}
) =>
  prisma.membership.create({
    data: {
      gymId,
      clientId,
      planId: 'plan',
      planName: 'Monthly',
      planType: 'monthly',
      startDate: new Date('2026-10-30T00:00:00Z'),
      endDate: new Date('2026-12-01T00:00:00Z'),
      price: '40.00',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'active',
      ...overrides,
    },
  });

const wipe = async (): Promise<void> => {
  await prisma.attendance.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.gymClosure.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
};

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();

  const gymData = {
    opensAt: '06:00',
    closesAt: '22:00',
    timezone: 'Europe/Tirane',
  };
  gymAId = (await prisma.gym.create({ data: { name: 'A', ...gymData } })).id;
  gymBId = (await prisma.gym.create({ data: { name: 'B', ...gymData } })).id;
  clientAId = (await makeClient(gymAId, 'a@test.dev')).id;
  clientBId = (await makeClient(gymBId, 'b@test.dev')).id;

  // Memberships reference a plan row.
  const plan = await prisma.membershipPlan.create({
    data: {
      gymId: gymAId,
      name: 'Monthly',
      type: 'monthly',
      durationDays: 30,
      price: '40.00',
    },
  });
  membershipAId = (await makeMembership(gymAId, clientAId, { planId: plan.id }))
    .id;
  await makeMembership(gymBId, clientBId, {
    planId: (
      await prisma.membershipPlan.create({
        data: {
          gymId: gymBId,
          name: 'Monthly',
          type: 'monthly',
          durationDays: 30,
          price: '40.00',
        },
      })
    ).id,
  });
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('attendanceService.checkIn', () => {
  it('allows several check-ins on one local day but ignores a repeated scan', async () => {
    const ctx = adminContext(gymAId);
    const record = await attendanceService.checkIn(ctx, clientAId, NOW);
    expect(record.membershipId).toBe(membershipAId);
    expect(record.clientName).toBe('a@test.dev');

    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-02T10:00:20Z')
      )
    ).rejects.toThrow(/just checked in/);

    // Coming back later the same day is a second entry.
    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-02T15:00:00Z')
      )
    ).resolves.toBeTruthy();
    expect(await prisma.attendance.count()).toBe(2);

    // The next local day is allowed.
    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-03T10:00:00Z')
      )
    ).resolves.toBeTruthy();
  });

  it('counts a day once against the weekly cap however many times they enter', async () => {
    const ctx = adminContext(gymAId);
    await prisma.membership.update({
      where: { id: membershipAId },
      data: { weeklyVisits: 1 },
    });

    await attendanceService.checkIn(ctx, clientAId, NOW);
    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-02T15:00:00Z')
      )
    ).resolves.toBeTruthy();
    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-03T10:00:00Z')
      )
    ).rejects.toThrow(/Weekly limit reached/);
  });

  it('enforces the plan weekly visit cap and resets on Monday', async () => {
    const ctx = adminContext(gymAId);
    await prisma.membership.update({
      where: { id: membershipAId },
      data: { weeklyVisits: 2 },
    });

    // 2026-11-02 is a Monday.
    await attendanceService.checkIn(ctx, clientAId, NOW);
    await attendanceService.checkIn(
      ctx,
      clientAId,
      new Date('2026-11-03T10:00:00Z')
    );
    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-04T10:00:00Z')
      )
    ).rejects.toThrow(/Weekly limit reached/);
    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-09T10:00:00Z')
      )
    ).resolves.toBeTruthy();
  });

  it('only allows entry inside opening hours in the gym timezone', async () => {
    const ctx = adminContext(gymAId);
    const tooEarly = new Date('2026-11-02T04:00:00Z'); // 05:00 local
    const tooLate = new Date('2026-11-02T22:30:00Z'); // 23:30 local
    const justOpen = new Date('2026-11-02T05:30:00Z'); // 06:30 local

    await expect(
      attendanceService.checkIn(ctx, clientAId, tooEarly)
    ).rejects.toThrow(/closed right now/);
    await expect(
      attendanceService.checkIn(ctx, clientAId, tooLate)
    ).rejects.toThrow(/closed right now/);
    await expect(
      attendanceService.checkIn(ctx, clientAId, justOpen)
    ).resolves.toBeTruthy();
  });

  it('blocks check-ins on a registered closure', async () => {
    const ctx = adminContext(gymAId);
    await gymClosureService.create(ctx, {
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      reason: 'Holiday',
    });
    await expect(
      attendanceService.checkIn(ctx, clientAId, NOW)
    ).rejects.toThrow(/Holiday/);
    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-03T10:00:00Z')
      )
    ).resolves.toBeTruthy();
  });

  it('requires an active client with a valid membership', async () => {
    const ctx = adminContext(gymAId);
    await prisma.membership.updateMany({
      where: { gymId: gymAId },
      data: { endDate: new Date('2026-11-01T00:00:00Z') },
    });
    await expect(
      attendanceService.checkIn(ctx, clientAId, NOW)
    ).rejects.toThrow(/No active membership/);

    await prisma.client.update({
      where: { id: clientAId },
      data: { isActive: false },
    });
    await expect(
      attendanceService.checkIn(ctx, clientAId, NOW)
    ).rejects.toThrow(/not active/);
  });

  it('uses up visits on visit packs and never goes below zero', async () => {
    await prisma.membership.update({
      where: { id: membershipAId },
      data: { planType: 'visit_based', visitsRemaining: 1 },
    });
    const ctx = adminContext(gymAId);
    await attendanceService.checkIn(ctx, clientAId, NOW);
    expect(
      (
        await prisma.membership.findUniqueOrThrow({
          where: { id: membershipAId },
        })
      ).visitsRemaining
    ).toBe(0);

    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-03T10:00:00Z')
      )
    ).rejects.toThrow(/No active membership/);
  });

  it('records only one check-in for simultaneous scans', async () => {
    await prisma.membership.update({
      where: { id: membershipAId },
      data: { planType: 'visit_based', visitsRemaining: 5 },
    });
    const ctx = adminContext(gymAId);
    const results = await Promise.allSettled([
      attendanceService.checkIn(ctx, clientAId, NOW),
      attendanceService.checkIn(ctx, clientAId, NOW),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.attendance.count()).toBe(1);
    expect(
      (
        await prisma.membership.findUniqueOrThrow({
          where: { id: membershipAId },
        })
      ).visitsRemaining
    ).toBe(4);
  });

  it('does not let one gym check in another gym client', async () => {
    await expect(
      attendanceService.checkIn(adminContext(gymBId), clientAId, NOW)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lets a client only check themselves in and see only their history', async () => {
    const ctx = clientContext(gymAId, clientAId);
    // Asking for someone else's id still checks in the caller.
    const record = await attendanceService.checkIn(ctx, 'someone-else', NOW);
    expect(record.clientId).toBe(clientAId);

    const mine = await attendanceService.list(ctx);
    expect(mine).toHaveLength(1);

    const otherClient = await makeClient(gymAId, 'other@test.dev');
    await prisma.attendance.create({
      data: {
        gymId: gymAId,
        clientId: otherClient.id,
        membershipId: membershipAId,
        checkedInAt: NOW,
      },
    });
    expect(await attendanceService.list(ctx)).toHaveLength(1);
    expect(await attendanceService.list(adminContext(gymBId))).toHaveLength(0);
  });

  it('pages the history newest first without repeats', async () => {
    const ctx = clientContext(gymAId, clientAId);
    for (let index = 0; index < 5; index += 1) {
      await prisma.attendance.create({
        data: {
          gymId: gymAId,
          clientId: clientAId,
          membershipId: membershipAId,
          checkedInAt: new Date(NOW.getTime() - index * 60 * 60 * 1000),
        },
      });
    }
    const hoursAgo = (row: { checkedInAt: string }): number =>
      (NOW.getTime() - new Date(row.checkedInAt).getTime()) / 3_600_000;

    const first = await attendanceService.history(ctx, { limit: 2 });
    expect(first.records.map(hoursAgo)).toEqual([0, 1]);
    expect(first.nextCursor).not.toBeNull();

    const second = await attendanceService.history(ctx, {
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.records.map(hoursAgo)).toEqual([2, 3]);

    const last = await attendanceService.history(ctx, {
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });
    expect(last.records.map(hoursAgo)).toEqual([4]);
    expect(last.nextCursor).toBeNull();
  });
});

describe('attendanceService.checkIn with several locations', () => {
  const coordinates = { latitude: 41.3275, longitude: 19.8187, mapUrl: '' };

  it('records where the member trained and counts every location in the weekly cap', async () => {
    const ctx = adminContext(gymAId);
    const center = await gymLocationService.create(ctx, {
      name: 'Center',
      address: 'Main street 1',
      phone: '',
      ...coordinates,
    });
    const north = await gymLocationService.create(ctx, {
      name: 'North',
      address: 'North street 2',
      phone: '',
      ...coordinates,
    });
    await prisma.membership.update({
      where: { id: membershipAId },
      data: { weeklyVisits: 2 },
    });

    await expect(
      attendanceService.checkIn(ctx, clientAId, NOW)
    ).rejects.toThrow(/Choose the gym location/);

    const first = await attendanceService.checkIn(
      ctx,
      clientAId,
      NOW,
      center.id
    );
    expect(first.locationId).toBe(center.id);
    expect(first.locationName).toBe('Center');

    const second = await attendanceService.checkIn(
      ctx,
      clientAId,
      new Date('2026-11-03T10:00:00Z'),
      north.id
    );
    expect(second.locationName).toBe('North');

    await expect(
      attendanceService.checkIn(
        ctx,
        clientAId,
        new Date('2026-11-04T10:00:00Z'),
        center.id
      )
    ).rejects.toThrow(/Weekly limit reached/);
  });

  it('uses the only location without asking and refuses one of another gym', async () => {
    const ctx = adminContext(gymAId);
    const only = await gymLocationService.create(ctx, {
      name: 'Center',
      address: 'Main street 1',
      phone: '',
      ...coordinates,
    });
    const foreign = await gymLocationService.create(adminContext(gymBId), {
      name: 'Elsewhere',
      address: 'Far street 9',
      phone: '',
      ...coordinates,
    });

    await expect(
      attendanceService.checkIn(ctx, clientAId, NOW, foreign.id)
    ).rejects.toThrow(/Choose one of the gym locations/);

    const record = await attendanceService.checkIn(ctx, clientAId, NOW);
    expect(record.locationId).toBe(only.id);
  });
});

describe('attendanceService.stats', () => {
  it('counts by gym-local day, week and month and current occupancy', async () => {
    const ctx = adminContext(gymAId);
    const record = (checkedInAt: string, extra = {}) =>
      prisma.attendance.create({
        data: {
          gymId: gymAId,
          clientId: clientAId,
          membershipId: membershipAId,
          checkedInAt: new Date(checkedInAt),
          ...extra,
        },
      });

    // 00:30 local on 2 Nov (still 1 Nov in UTC) counts as today.
    await record('2026-11-01T23:30:00Z');
    await record('2026-11-02T09:30:00Z');
    await record('2026-11-02T08:30:00Z', {
      checkedOutAt: new Date('2026-11-02T09:00:00Z'),
    });
    // Previous Sunday: same month, previous week.
    await record('2026-11-01T12:00:00Z');
    // Previous month.
    await record('2026-10-20T12:00:00Z');

    const stats = await attendanceService.stats(ctx, NOW);
    expect(stats.today).toBe(3);
    expect(stats.thisWeek).toBe(3);
    expect(stats.thisMonth).toBe(4);
    // 09:30Z is inside the 3h window and not checked out; the others are not.
    expect(stats.currentlyInside).toBe(1);

    const other = await attendanceService.stats(adminContext(gymBId), NOW);
    expect(other).toEqual({
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      currentlyInside: 0,
    });
  });
});
