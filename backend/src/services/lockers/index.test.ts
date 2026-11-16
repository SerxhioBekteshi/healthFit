import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { accessSettingsService } from '@/services/access-settings';
import { attendanceService } from '@/services/attendance';
import { dashboardService } from '@/services/dashboard';
import { genderSettingsService } from '@/services/gender-settings';
import { lockerService } from '@/services/lockers';
import { memberCardService } from '@/services/member-cards';
import { membershipPlanService } from '@/services/membership-plans';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/errors';

const prisma = new PrismaClient();

// 11:00 local time in Europe/Tirane (UTC+1 in November).
const NOW = new Date('2026-11-02T10:00:00Z');
const LATER = new Date('2026-11-02T11:30:00Z');

let gymId: string;
let otherGymId: string;
let locationId: string;
let anaId: string;
let bobId: string;

const adminContext = (id: string): TenantContext => ({
  user: {
    id: `admin-${id}`,
    email: `admin-${id}@test.dev`,
    name: 'Admin',
    role: 'gym_admin',
    gymId: id,
  },
  role: 'gym_admin',
  gymId: id,
  clientId: null,
  db: createTenantDb(prisma, id),
});

const clientContext = (id: string, clientId: string): TenantContext => ({
  ...adminContext(id),
  user: {
    id: `user-${clientId}`,
    email: 'c@test.dev',
    name: 'Client',
    role: 'client',
    gymId: id,
  },
  role: 'client',
  clientId,
});

const admin = (): TenantContext => adminContext(gymId);

const makeMember = async (
  name: string,
  gender: 'male' | 'female' | null = null
): Promise<string> => {
  const client = await prisma.client.create({
    data: {
      gymId,
      fullName: name,
      email: `${name.toLowerCase()}@test.dev`,
      gender: gender ?? undefined,
    },
  });
  const plan = await prisma.membershipPlan.create({
    data: {
      gymId,
      name: `Monthly ${name}`,
      type: 'monthly',
      durationDays: 30,
      price: '40.00',
    },
  });
  await prisma.membership.create({
    data: {
      gymId,
      clientId: client.id,
      planId: plan.id,
      planName: plan.name,
      planType: 'monthly',
      startDate: new Date('2026-10-30T00:00:00Z'),
      endDate: new Date('2026-12-01T00:00:00Z'),
      price: '40.00',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'active',
    },
  });
  return client.id;
};

const wipe = async (): Promise<void> => {
  await prisma.attendance.deleteMany();
  await prisma.locker.deleteMany();
  await prisma.memberCard.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gymLocation.deleteMany();
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
  gymId = (
    await prisma.gym.create({
      data: { name: 'A', cardsEnabled: true, ...gymData },
    })
  ).id;
  otherGymId = (
    await prisma.gym.create({
      data: { name: 'B', cardsEnabled: true, ...gymData },
    })
  ).id;
  locationId = (
    await prisma.gymLocation.create({ data: { gymId, name: 'Main' } })
  ).id;
  anaId = await makeMember('Ana');
  bobId = await makeMember('Bob');
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

const issue = (clientId: string, number: string) =>
  memberCardService.issue(admin(), { clientId, number });

const addLockers = (
  from = 1,
  to = 3,
  prefix = '',
  gender: 'male' | 'female' = 'male'
) =>
  lockerService.createRange(admin(), { locationId, gender, prefix, from, to });

describe('memberCardService', () => {
  it('stores the number in upper case and replaces the active card', async () => {
    const first = await issue(anaId, 'ab-12');
    expect(first.number).toBe('AB-12');

    const second = await issue(anaId, 'cd-34');
    const cards = await memberCardService.list(admin());
    expect(cards.find((card) => card.id === first.id)).toMatchObject({
      isActive: false,
    });
    expect(
      cards.find((card) => card.id === first.id)?.deactivatedAt
    ).not.toBeNull();
    expect(cards.find((card) => card.id === second.id)?.isActive).toBe(true);

    // The old card cannot come back while the new one is active.
    await expect(
      memberCardService.setActive(admin(), first.id, true)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('keeps numbers unique per gym and needs cards turned on', async () => {
    await issue(anaId, 'AB-12');
    await expect(issue(bobId, 'ab-12')).rejects.toBeInstanceOf(ConflictError);
    // Another gym may use the same number.
    const otherClient = await prisma.client.create({
      data: { gymId: otherGymId, fullName: 'Z', email: 'z@test.dev' },
    });
    await expect(
      memberCardService.issue(adminContext(otherGymId), {
        clientId: otherClient.id,
        number: 'AB-12',
      })
    ).resolves.toMatchObject({ number: 'AB-12' });

    await accessSettingsService.update(admin(), {
      cardsEnabled: false,
      lockersUseCard: false,
    });
    await expect(issue(bobId, 'XY-99')).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('attendanceService.scan', () => {
  it('checks a member in and then out with the same card', async () => {
    await issue(anaId, 'AB-12');
    const inResult = await attendanceService.scan(admin(), 'ab-12', NOW);
    expect(inResult.action).toBe('checked_in');
    expect(inResult.record.clientId).toBe(anaId);

    const outResult = await attendanceService.scan(admin(), 'AB-12', LATER);
    expect(outResult.action).toBe('checked_out');
    expect(outResult.record.checkedOutAt).toBe(LATER.toISOString());

    // Out again means a new entry.
    const again = await attendanceService.scan(
      admin(),
      'AB-12',
      new Date('2026-11-02T13:00:00Z')
    );
    expect(again.action).toBe('checked_in');
  });

  it('does not treat a double tap as a check-out, and also takes the member code', async () => {
    const first = await attendanceService.scan(admin(), anaId, NOW);
    expect(first.action).toBe('checked_in');
    await expect(
      attendanceService.scan(admin(), anaId, new Date(NOW.getTime() + 20_000))
    ).rejects.toThrow(/just checked in/);
  });

  it('refuses a blocked or unknown card', async () => {
    const card = await issue(anaId, 'AB-12');
    await memberCardService.setActive(admin(), card.id, false);
    await expect(attendanceService.scan(admin(), 'AB-12', NOW)).rejects.toThrow(
      /no longer active/
    );
    await expect(
      attendanceService.scan(admin(), 'NOPE-1', NOW)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lets a member check themselves out and rejects it when not inside', async () => {
    await expect(
      attendanceService.checkOut(clientContext(gymId, anaId), undefined, NOW)
    ).rejects.toBeInstanceOf(ValidationError);
    await attendanceService.checkIn(admin(), anaId, NOW);
    const record = await attendanceService.checkOut(
      clientContext(gymId, anaId),
      undefined,
      LATER
    );
    expect(record.checkedOutAt).toBe(LATER.toISOString());
  });
});

describe('lockerService', () => {
  it('adds a numbered range with a prefix and keeps existing lockers', async () => {
    const lockers = await addLockers(8, 11, 'm');
    expect(lockers.map((locker) => locker.number)).toEqual([
      'M8',
      'M9',
      'M10',
      'M11',
    ]);
    const again = await addLockers(10, 12, 'M');
    expect(again).toHaveLength(5);
  });

  it('gives a locker to a member who is inside and frees it at check-out', async () => {
    await addLockers();
    await expect(
      lockerService.assign(admin(), { lockerNumber: '1', code: anaId }, NOW)
    ).rejects.toThrow(/not checked in/);

    await attendanceService.checkIn(admin(), anaId, NOW);
    await attendanceService.checkIn(admin(), bobId, NOW);
    const assigned = await lockerService.assign(
      admin(),
      { lockerNumber: '1', code: anaId },
      NOW
    );
    expect(assigned).toMatchObject({ lockerNumber: '1', clientName: 'Ana' });

    await expect(
      lockerService.assign(admin(), { lockerNumber: '1', code: bobId }, NOW)
    ).rejects.toBeInstanceOf(ConflictError);

    const listed = await lockerService.list(admin(), undefined, NOW);
    expect(
      listed.find((locker) => locker.number === '1')?.occupiedBy
    ).toMatchObject({ clientName: 'Ana' });
    await expect(
      lockerService.remove(
        admin(),
        listed.find((locker) => locker.number === '1')?.id ?? '',
        NOW
      )
    ).rejects.toBeInstanceOf(ConflictError);

    const dashboard = await dashboardService.forClient(
      clientContext(gymId, anaId)
    );
    expect(dashboard.locker).toBeNull();

    await attendanceService.checkOut(admin(), anaId, LATER);
    await expect(
      lockerService.assign(admin(), { lockerNumber: '1', code: bobId }, LATER)
    ).resolves.toMatchObject({ lockerNumber: '1' });
  });

  it('shows the locker on the member dashboard while they are inside', async () => {
    await addLockers();
    const now = new Date();
    await prisma.gym.update({
      where: { id: gymId },
      data: { opensAt: '00:00', closesAt: '23:59' },
    });
    await prisma.membership.updateMany({
      data: {
        startDate: new Date('2020-01-01T00:00:00Z'),
        endDate: new Date('2099-01-01T00:00:00Z'),
      },
    });
    await attendanceService.checkIn(admin(), anaId, now);
    await lockerService.assign(
      admin(),
      { lockerNumber: '2', code: anaId },
      now
    );
    const dashboard = await dashboardService.forClient(
      clientContext(gymId, anaId)
    );
    expect(dashboard.checkedIn).toBe(true);
    expect(dashboard.locker).toMatchObject({
      lockerNumber: '2',
      locationName: 'Main',
    });
  });

  it('rejects out of service lockers and unknown numbers', async () => {
    const [first] = await addLockers(1, 2);
    await attendanceService.checkIn(admin(), anaId, NOW);
    await lockerService.setActive(admin(), first?.id ?? '', false, NOW);
    await expect(
      lockerService.assign(admin(), { lockerNumber: '1', code: anaId }, NOW)
    ).rejects.toThrow(/out of service/);
    await expect(
      lockerService.assign(admin(), { lockerNumber: '99', code: anaId }, NOW)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lets a member pick a key locker, but locks with the card when the gym says so', async () => {
    await addLockers();
    await attendanceService.checkIn(admin(), anaId, NOW);
    const self = clientContext(gymId, anaId);
    await expect(
      lockerService.assign(self, { lockerNumber: '3' }, NOW)
    ).resolves.toMatchObject({ lockerNumber: '3' });
    await lockerService.release(self, {}, NOW);
    await expect(lockerService.release(self, {}, NOW)).rejects.toBeInstanceOf(
      ValidationError
    );

    await issue(anaId, 'AB-12');
    await accessSettingsService.update(admin(), {
      cardsEnabled: true,
      lockersUseCard: true,
    });
    await expect(
      lockerService.assign(self, { lockerNumber: '3' }, NOW)
    ).rejects.toBeInstanceOf(ForbiddenError);
    // At the locker the card is tapped; the member code is not enough.
    await expect(
      lockerService.assign(admin(), { lockerNumber: '3', code: anaId }, NOW)
    ).rejects.toThrow(/scan the member card/);
    await expect(
      lockerService.assign(admin(), { lockerNumber: '3', code: 'ab-12' }, NOW)
    ).resolves.toMatchObject({ lockerNumber: '3' });
  });

  it('keeps lockers of another gym out of reach', async () => {
    await addLockers();
    const other = adminContext(otherGymId);
    expect(await lockerService.list(other)).toEqual([]);
    const locker = (await lockerService.list(admin()))[0];
    await expect(
      lockerService.setActive(other, locker?.id ?? '', false)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('accessSettingsService', () => {
  it('only needs cards turned on for card lockers', async () => {
    expect(await accessSettingsService.get(admin())).toEqual({
      cardsEnabled: true,
      lockersUseCard: false,
    });
  });
});

describe('gender-separated lockers', () => {
  it("keeps a men's and a women's locker with the same number apart", async () => {
    await addLockers(1, 2, '', 'male');
    await addLockers(1, 2, '', 'female');
    const anaFemale = await makeMember('AnaF', 'female');
    const bobMale = await makeMember('BobM', 'male');
    await attendanceService.checkIn(admin(), anaFemale, NOW);
    await attendanceService.checkIn(admin(), bobMale, NOW);

    const herLocker = await lockerService.assign(
      admin(),
      { lockerNumber: '1', code: anaFemale },
      NOW
    );
    const hisLocker = await lockerService.assign(
      admin(),
      { lockerNumber: '1', code: bobMale },
      NOW
    );
    expect(herLocker.lockerNumber).toBe('1');
    expect(hisLocker.lockerNumber).toBe('1');

    const listed = await lockerService.list(admin(), undefined, NOW);
    expect(listed.filter((locker) => locker.number === '1')).toHaveLength(2);
  });

  it('asks to set the gender first when a number is ambiguous', async () => {
    await addLockers(1, 1, '', 'male');
    await addLockers(1, 1, '', 'female');
    const noGender = await makeMember('NoGender');
    await attendanceService.checkIn(admin(), noGender, NOW);
    await expect(
      lockerService.assign(admin(), { lockerNumber: '1', code: noGender }, NOW)
    ).rejects.toThrow(/set this member's gender/);
  });
});

describe('genderSettingsService', () => {
  it('mirrors a new locker range to both genders when turned on', async () => {
    await genderSettingsService.update(admin(), {
      samePricesForGenders: false,
      sameLockersForGenders: true,
    });
    const created = await addLockers(1, 2, 'M', 'male');
    expect(created.filter((locker) => locker.gender === 'male')).toHaveLength(
      2
    );
    expect(created.filter((locker) => locker.gender === 'female')).toHaveLength(
      2
    );

    // Prices are a separate setting and stay off.
    await membershipPlanService.savePriceGrid(admin(), {
      gender: 'male',
      cells: [{ weeklyVisits: 4, type: 'monthly', price: 4500 }],
    });
    const plans = await membershipPlanService.list(admin());
    expect(
      plans.find((plan) => plan.gender === 'female' && plan.weeklyVisits === 4)
    ).toBeUndefined();
  });

  it('mirrors the standard price grid to both genders when turned on', async () => {
    await genderSettingsService.update(admin(), {
      samePricesForGenders: true,
      sameLockersForGenders: false,
    });
    await membershipPlanService.savePriceGrid(admin(), {
      gender: 'male',
      cells: [{ weeklyVisits: 4, type: 'monthly', price: 4500 }],
    });
    const plans = await membershipPlanService.list(admin());
    const men = plans.find(
      (plan) => plan.gender === 'male' && plan.weeklyVisits === 4
    );
    const women = plans.find(
      (plan) => plan.gender === 'female' && plan.weeklyVisits === 4
    );
    expect(men?.price).toBe(4500);
    expect(women?.price).toBe(4500);

    // Lockers are a separate setting and stay off.
    const created = await addLockers(1, 2, 'M', 'male');
    expect(created.filter((locker) => locker.gender === 'female')).toHaveLength(
      0
    );
  });

  it('keeps prices separate per gender when turned off', async () => {
    await membershipPlanService.savePriceGrid(admin(), {
      gender: 'male',
      cells: [{ weeklyVisits: 4, type: 'monthly', price: 5000 }],
    });
    const plans = await membershipPlanService.list(admin());
    expect(
      plans.find((plan) => plan.gender === 'female' && plan.weeklyVisits === 4)
    ).toBeUndefined();
  });
});
