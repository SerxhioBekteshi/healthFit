import { createHash } from 'node:crypto';
import {
  PrismaClient,
  type Client,
  type Gender,
  type Gym,
  type Membership,
  type MembershipPlan,
  type PaymentMethod,
  type UserRole,
} from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { describeExercise } from '../src/services/workout-programs/guides';
import { workoutProgramService } from '../src/services/workout-programs';
import { DEFAULT_CLASSES } from '../src/services/classes/defaults';

const prisma = new PrismaClient();

// Development-only credentials shared by every demo account.
const DEV_PASSWORD = 'Password123!';

const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar date (UTC midnight) relative to today.
const dateOnly = (offsetDays: number): Date => {
  const base = new Date(Date.now() + offsetDays * DAY_MS);
  return new Date(`${base.toISOString().slice(0, 10)}T00:00:00.000Z`);
};

// Instant relative to now, optionally pinned to an hour of the day (UTC).
const instant = (offsetDays: number, hourUtc?: number): Date => {
  const base = new Date(Date.now() + offsetDays * DAY_MS);
  if (hourUtc !== undefined) {
    base.setUTCHours(hourUtc, 15, 0, 0);
  }
  return base;
};

const minutesAgo = (minutes: number): Date =>
  new Date(Date.now() - minutes * 60 * 1000);

const accounts: { role: string; email: string; note: string }[] = [];

const createUser = async (
  name: string,
  email: string,
  role: UserRole,
  gymId: string | null,
  note: string
) => {
  const user = await prisma.user.create({
    data: { name, email, emailVerified: true, role, gymId },
  });
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: await hashPassword(DEV_PASSWORD),
    },
  });
  accounts.push({ role, email, note });
  return user;
};

const clearAll = async (): Promise<void> => {
  await prisma.signupRequest.deleteMany();
  await prisma.gymClass.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workoutDay.deleteMany();
  await prisma.workoutProgram.deleteMany();
  await prisma.productSale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.locker.deleteMany();
  await prisma.memberCard.deleteMany();
  await prisma.gymLocation.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.priceOffer.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.priceListNote.deleteMany();
  await prisma.paymentChallenge.deleteMany();
  await prisma.gymPhoto.deleteMany();
  await prisma.gymClosure.deleteMany();
  await prisma.clientInvite.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gymSubscriptionPayment.deleteMany();
  await prisma.gymSubscription.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
};

interface GenderPlans {
  // 4x per week, used as the demo plan for memberships.
  monthly: MembershipPlan;
  threeMonths: MembershipPlan;
  yearly: MembershipPlan;
  visitPack: MembershipPlan;
}

interface PlanSet {
  male: GenderPlans;
  female: GenderPlans;
}

const WEEKLY_VISITS = [3, 4, 5, 6] as const;

const DURATIONS = [
  { type: 'monthly', days: 30, label: '1 Month' },
  { type: 'three_months', days: 90, label: '3 Months' },
  { type: 'six_months', days: 180, label: '6 Months' },
  { type: 'yearly', days: 365, label: '12 Months' },
] as const;

// Standard price list in ALL per term, ordered like WEEKLY_VISITS (3x, 4x, 5x, 6x per week).
const PRICES: Record<(typeof DURATIONS)[number]['type'], number[]> = {
  monthly: [4500, 5000, 5500, 6000],
  three_months: [11500, 13500, 14500, 16000],
  six_months: [21000, 23000, 24500, 26000],
  yearly: [30000, 33500, 37000, 41000],
};

const PRICE_LIST_NOTES = [
  'Subscription at any hour of the day',
  'Fitness with instructor: Class & Crossfit',
];

const createPriceListNotes = (gymId: string) =>
  prisma.priceListNote.createMany({
    data: PRICE_LIST_NOTES.map((text, position) => ({
      gymId,
      text,
      position,
    })),
  });

const createPlans = async (gymId: string): Promise<PlanSet> => {
  const result: Partial<Record<Gender, GenderPlans>> = {};

  for (const gender of ['male', 'female'] as const) {
    const created: Record<string, MembershipPlan> = {};
    for (const duration of DURATIONS) {
      for (const [index, weeklyVisits] of WEEKLY_VISITS.entries()) {
        created[`${duration.type}-${weeklyVisits}`] =
          await prisma.membershipPlan.create({
            data: {
              gymId,
              name: `${weeklyVisits}x / week - ${duration.label}`,
              type: duration.type,
              durationDays: duration.days,
              gender,
              weeklyVisits,
              price: PRICES[duration.type][index].toFixed(2),
            },
          });
      }
    }
    const visitPack = await prisma.membershipPlan.create({
      data: {
        gymId,
        name: '10 Visit Pack',
        type: 'visit_based',
        durationDays: 180,
        visitCount: 10,
        gender,
        price: '2500.00',
      },
    });
    await prisma.membershipPlan.create({
      data: {
        gymId,
        name: 'Daily pass',
        type: 'visit_based',
        durationDays: 1,
        visitCount: 1,
        gender,
        price: '1000.00',
      },
    });
    result[gender] = {
      monthly: created['monthly-4'],
      threeMonths: created['three_months-4'],
      yearly: created['yearly-4'],
      visitPack,
    };
  }

  return {
    male: result.male as GenderPlans,
    female: result.female as GenderPlans,
  };
};

// A running and a scheduled offer, to show the offer price next to the regular one.
const createDemoOffers = async (
  gymId: string,
  plans: PlanSet
): Promise<void> => {
  const day = (offsetDays: number): Date =>
    new Date(`${instant(offsetDays).toISOString().slice(0, 10)}T00:00:00.000Z`);
  const offers = [
    {
      name: "New Year's Eve",
      start: -5,
      end: 25,
      items: [
        { plan: plans.male.monthly, price: '4000.00' },
        { plan: plans.female.monthly, price: '4000.00' },
      ],
    },
    {
      name: 'Spring price list',
      start: 40,
      end: 100,
      items: [
        { plan: plans.male.yearly, price: '30000.00' },
        { plan: plans.female.yearly, price: '30000.00' },
      ],
    },
  ];
  for (const offer of offers) {
    await prisma.priceOffer.create({
      data: {
        gymId,
        name: offer.name,
        startDate: day(offer.start),
        endDate: day(offer.end),
        items: {
          create: offer.items.map((item) => ({
            gymId,
            planId: item.plan.id,
            price: item.price,
          })),
        },
      },
    });
  }
};

let referenceCounter = 0;
const reference = (prefix: string): string =>
  `${prefix}-DEMO${String(++referenceCounter).padStart(4, '0')}`;

const createClient = async (
  gym: Gym,
  slug: string,
  name: string,
  emailLocal: string,
  options: {
    isActive?: boolean;
    note: string;
    phone?: string;
    gender: Gender;
  }
): Promise<Client> => {
  const email = `${emailLocal}@${slug}.test`;
  const user = await createUser(name, email, 'client', gym.id, options.note);
  return prisma.client.create({
    data: {
      gymId: gym.id,
      userId: user.id,
      fullName: name,
      email,
      phone: options.phone ?? '+355691234567',
      gender: options.gender,
      isActive: options.isActive ?? true,
    },
  });
};

interface MembershipOptions {
  start: number;
  method?: PaymentMethod;
  pending?: boolean;
  visitsRemaining?: number;
}

// Mirrors what the membership service writes: membership plus its ledger row.
const createMembership = async (
  gym: Gym,
  client: Client,
  plan: MembershipPlan,
  options: MembershipOptions
): Promise<Membership> => {
  const method = options.method ?? 'cash';
  const paid = !options.pending;
  const paymentReference = reference(
    method === 'bank_transfer' ? 'BANK' : 'CASH'
  );
  const membership = await prisma.membership.create({
    data: {
      gymId: gym.id,
      clientId: client.id,
      planId: plan.id,
      planName: plan.name,
      planType: plan.type,
      weeklyVisits: plan.weeklyVisits,
      startDate: dateOnly(options.start),
      endDate: dateOnly(options.start + plan.durationDays),
      price: plan.price,
      paymentMethod: method,
      paymentStatus: paid ? 'paid' : 'pending',
      paymentReference,
      status: paid ? 'active' : 'pending',
      visitsRemaining:
        plan.type === 'visit_based'
          ? (options.visitsRemaining ?? plan.visitCount)
          : 0,
    },
  });
  await prisma.balanceTransaction.create({
    data: {
      gymId: gym.id,
      clientId: client.id,
      type: 'membership',
      amount: 0,
      paymentMethod: method,
      providerStatus: paid ? 'paid' : 'pending',
      description: `Membership: ${plan.name}`,
      referenceId: paymentReference,
      createdAt: instant(options.start),
    },
  });
  return membership;
};

const deposit = (
  gym: Gym,
  client: Client,
  amount: string,
  method: PaymentMethod,
  offsetDays: number
) =>
  prisma.balanceTransaction.create({
    data: {
      gymId: gym.id,
      clientId: client.id,
      type: 'deposit',
      amount,
      paymentMethod: method,
      providerStatus: 'paid',
      description: 'Balance deposit',
      referenceId: reference(method === 'cash' ? 'CASH' : 'CARD'),
      createdAt: instant(offsetDays),
    },
  });

const visits = (
  gym: Gym,
  client: Client,
  membership: Membership,
  daysAgo: number[],
  locationIds: string[] = []
) =>
  prisma.attendance.createMany({
    data: daysAgo.map((offset, index) => ({
      gymId: gym.id,
      clientId: client.id,
      membershipId: membership.id,
      // Members alternate between the gym's locations.
      locationId: locationIds.length
        ? locationIds[index % locationIds.length]
        : null,
      checkedInAt: instant(-offset, 17),
      checkedOutAt: instant(-offset, 18),
    })),
  });

const createLocations = async (
  gym: Gym,
  locations: {
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    mapUrl?: string;
  }[]
): Promise<string[]> => {
  const ids: string[] = [];
  for (const location of locations) {
    const row = await prisma.gymLocation.create({
      data: { gymId: gym.id, ...location },
    });
    ids.push(row.id);
  }
  return ids;
};

interface ExerciseSeed {
  name: string;
  icon: string;
  sets: number;
  reps: number;
  weight?: number;
  rest?: number;
  notes?: string;
}

const createProgram = async (
  gymId: string,
  name: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  description: string,
  days: { focus: string; exercises: ExerciseSeed[] }[]
) => {
  const program = await prisma.workoutProgram.create({
    data: {
      gymId,
      name,
      level,
      description,
      sessionsPerWeek: days.length,
    },
  });
  for (const [dayIndex, day] of days.entries()) {
    const created = await prisma.workoutDay.create({
      data: {
        gymId,
        programId: program.id,
        dayNumber: dayIndex + 1,
        focus: day.focus,
      },
    });
    await prisma.exercise.createMany({
      data: day.exercises.map((exercise, position) => ({
        gymId,
        dayId: created.id,
        position,
        name: exercise.name,
        icon: exercise.icon,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: (exercise.weight ?? 0).toFixed(2),
        restSeconds: exercise.rest ?? 60,
        notes: describeExercise(exercise.name, exercise.notes),
      })),
    });
  }
};

const sellProduct = async (
  gym: Gym,
  productId: string,
  price: string,
  method: PaymentMethod,
  client: Client | null,
  offsetDays: number
) => {
  await prisma.productSale.create({
    data: {
      gymId: gym.id,
      productId,
      clientId: client?.id ?? null,
      quantity: 1,
      unitPrice: price,
      total: price,
      paymentMethod: method,
      createdAt: instant(offsetDays),
    },
  });
  if (client) {
    await prisma.balanceTransaction.create({
      data: {
        gymId: gym.id,
        clientId: client.id,
        type: 'purchase',
        amount: method === 'balance' ? `-${price}` : 0,
        paymentMethod: method,
        providerStatus: 'paid',
        description: 'Purchase',
        referenceId: reference(method === 'balance' ? 'BAL' : 'CASH'),
        createdAt: instant(offsetDays),
      },
    });
  }
};

// ---------------------------------------------------------------------------
// Gym Alpha: open 24/7 so check-ins always work while testing
// ---------------------------------------------------------------------------

// Every gym starts with the default timetable and no instructors.
const createDefaultClasses = (gymId: string) =>
  prisma.gymClass.createMany({
    data: DEFAULT_CLASSES.map((item) => ({ gymId, ...item })),
  });

// Alpha also has staff, put in front of some of the default classes.
const createAlphaStaff = async (gymId: string): Promise<void> => {
  const [marina, eni, dritan] = await Promise.all(
    [
      { fullName: 'Marina Dervishi', specialty: 'Abs & core' },
      { fullName: 'Eni Kola', specialty: 'Aerobics & dance' },
      { fullName: 'Dritan Berisha', specialty: 'Strength & conditioning' },
    ].map((staff) => prisma.staffMember.create({ data: { gymId, ...staff } }))
  );
  await prisma.staffMember.create({
    data: {
      gymId,
      fullName: 'Old Coach',
      specialty: 'Left the gym',
      isActive: false,
    },
  });

  const instructors: [string[], string][] = [
    [['Abs', 'Stretching & Mobility'], marina.id],
    [['Aerobics', 'Zumba'], eni.id],
    [['Cross Training', 'Spinning'], dritan.id],
  ];
  for (const [names, staffMemberId] of instructors) {
    await prisma.gymClass.updateMany({
      where: { gymId, name: { in: names } },
      data: { staffMemberId },
    });
  }
};

// Created by the gym without a password: no login until the invite link is used.
const DEMO_INVITE_TOKEN = 'demo-invite-ilir-alpha';

const createInvitedClient = async (gym: Gym): Promise<void> => {
  const email = 'ilir@alpha.test';
  const user = await prisma.user.create({
    data: {
      name: 'Ilir Invited',
      email,
      emailVerified: true,
      role: 'client',
      gymId: gym.id,
    },
  });
  const client = await prisma.client.create({
    data: {
      gymId: gym.id,
      userId: user.id,
      fullName: 'Ilir Invited',
      email,
      phone: '+355691112233',
      gender: 'male',
    },
  });
  await prisma.clientInvite.create({
    data: {
      gymId: gym.id,
      clientId: client.id,
      tokenHash: createHash('sha256').update(DEMO_INVITE_TOKEN).digest('hex'),
      expiresAt: instant(7),
    },
  });
};

const seedAlpha = async () => {
  const gym = await prisma.gym.create({
    data: {
      name: 'Alpha Gym',
      location: 'Tirana',
      address: 'Rruga Kavajes 33, Tirana',
      contactEmail: 'info@alpha.test',
      contactPhone: '+355 4 222 3344',
      subdomain: 'alpha',
      businessHours: 'Open 24/7 (demo)',
      opensAt: '00:00',
      closesAt: '23:59',
      timezone: 'Europe/Tirane',
      cardsEnabled: true,
    },
  });
  await createUser(
    'Elira Admin',
    'admin@alpha.test',
    'gym_admin',
    gym.id,
    'Gym admin of Alpha Gym'
  );

  const plans = await createPlans(gym.id);
  await createPriceListNotes(gym.id);
  await createDemoOffers(gym.id, plans);
  await createDefaultClasses(gym.id);
  await createAlphaStaff(gym.id);
  const locations = await createLocations(gym, [
    {
      name: 'Alpha Kavaje',
      address: 'Rruga Kavajes 33, Tirana',
      phone: '+355 4 222 3344',
      latitude: 41.3256,
      longitude: 19.8049,
    },
    {
      name: 'Alpha Blloku',
      address: 'Rruga Pjeter Bogdani 8, Tirana',
      phone: '+355 4 222 5566',
      latitude: 41.3197,
      longitude: 19.8186,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=41.3197,19.8186',
    },
  ]);

  // Changing-room lockers (locked with a key) at the first location.
  await prisma.locker.createMany({
    data: Array.from({ length: 20 }, (_, index) => ({
      gymId: gym.id,
      locationId: locations[0],
      number: String(index + 1),
    })),
  });
  const locker7 = await prisma.locker.findFirstOrThrow({
    where: { gymId: gym.id, number: '7' },
  });

  // Main demo client: active monthly membership, balance, history. No check-in today.
  const alex = await createClient(gym, 'alpha', 'Alex Demo', 'client', {
    note: 'Main demo client: active membership, balance, history',
    gender: 'male',
  });
  const alexMembership = await createMembership(gym, alex, plans.male.monthly, {
    start: -10,
  });
  await deposit(gym, alex, '6000.00', 'cash', -9);
  await visits(gym, alex, alexMembership, [1, 2, 4, 5, 7, 8], locations);
  await prisma.memberCard.create({
    data: { gymId: gym.id, clientId: alex.id, number: 'ALEX-1001' },
  });

  // Visit pack with 7 of 10 visits left.
  const ana = await createClient(gym, 'alpha', 'Ana Prifti', 'ana', {
    note: 'Visit pack: 7 visits left, balance 2000',
    gender: 'female',
  });
  const anaMembership = await createMembership(
    gym,
    ana,
    plans.female.visitPack,
    {
      start: -20,
      visitsRemaining: 7,
    }
  );
  await deposit(gym, ana, '2000.00', 'card', -15);
  await visits(gym, ana, anaMembership, [3, 6, 12], [locations[1]]);
  await prisma.memberCard.create({
    data: { gymId: gym.id, clientId: ana.id, number: 'ANA-3003' },
  });

  // Currently inside the gym (checked in 40 minutes ago).
  const jon = await createClient(gym, 'alpha', 'Jon Sula', 'jon', {
    note: 'Yearly member, checked in today (counted as inside)',
    gender: 'male',
  });
  const jonMembership = await createMembership(gym, jon, plans.male.yearly, {
    start: -60,
    method: 'card',
  });
  await visits(gym, jon, jonMembership, [1, 2, 3, 5, 6, 9, 10], [locations[0]]);
  await prisma.attendance.create({
    data: {
      gymId: gym.id,
      clientId: jon.id,
      membershipId: jonMembership.id,
      locationId: locations[0],
      lockerId: locker7.id,
      checkedInAt: minutesAgo(40),
    },
  });
  await prisma.memberCard.create({
    data: { gymId: gym.id, clientId: jon.id, number: 'JON-2002' },
  });

  // Expired membership: cannot check in until renewed.
  const mira = await createClient(gym, 'alpha', 'Mira Leka', 'mira', {
    note: 'Expired membership: try renewing it as the gym admin',
    gender: 'female',
  });
  const miraMembership = await createMembership(
    gym,
    mira,
    plans.female.monthly,
    {
      start: -50,
    }
  );
  await visits(gym, mira, miraMembership, [25, 28, 33]);
  // A lost card (retired) replaced by the current one; the card still works only with an active membership.
  await prisma.memberCard.createMany({
    data: [
      {
        gymId: gym.id,
        clientId: mira.id,
        number: 'MIRA-4000',
        isActive: false,
        issuedAt: instant(-80),
        deactivatedAt: instant(-45),
      },
      {
        gymId: gym.id,
        clientId: mira.id,
        number: 'MIRA-4004',
        issuedAt: instant(-45),
      },
    ],
  });

  // Bank transfer waiting for the gym admin to confirm.
  const leo = await createClient(gym, 'alpha', 'Leo Marku', 'leo', {
    note: 'Pending bank-transfer membership: confirm it as the gym admin',
    gender: 'male',
  });
  await createMembership(gym, leo, plans.male.threeMonths, {
    start: 0,
    method: 'bank_transfer',
    pending: true,
  });
  await prisma.memberCard.create({
    data: { gymId: gym.id, clientId: leo.id, number: 'LEO-5005' },
  });

  // Deactivated member.
  const sara = await createClient(gym, 'alpha', 'Sara Hoxha', 'sara', {
    isActive: false,
    note: 'Deactivated client account',
    gender: 'female',
  });
  await prisma.memberCard.create({
    data: {
      gymId: gym.id,
      clientId: sara.id,
      number: 'SARA-6006',
      isActive: false,
      issuedAt: instant(-120),
      deactivatedAt: instant(-30),
    },
  });
  await createInvitedClient(gym);

  const water = await prisma.product.create({
    data: {
      gymId: gym.id,
      name: 'Water 500ml',
      category: 'drink',
      price: '1.00',
      stock: 120,
    },
  });
  // Shakes and smoothies are made to order: no stock, cash only.
  const shake = await prisma.product.create({
    data: {
      gymId: gym.id,
      name: 'Protein Shake',
      category: 'shake',
      price: '4.50',
      stock: 0,
    },
  });
  await prisma.product.create({
    data: {
      gymId: gym.id,
      name: 'Protein Bar',
      category: 'snack',
      price: '2.50',
      stock: 3,
    },
  });
  await prisma.product.create({
    data: {
      gymId: gym.id,
      name: 'Smoothie',
      category: 'smoothie',
      price: '5.00',
      stock: 0,
    },
  });
  await prisma.product.create({
    data: {
      gymId: gym.id,
      name: 'Old T-shirt',
      category: 'merchandise',
      price: '15.00',
      stock: 8,
      isActive: false,
    },
  });
  await sellProduct(gym, water.id, '1.00', 'cash', null, -2);
  await sellProduct(gym, water.id, '1.00', 'balance', alex, -3);
  await sellProduct(gym, shake.id, '4.50', 'cash', alex, -2);
  await sellProduct(gym, shake.id, '4.50', 'cash', ana, -1);

  // The standard programs every new gym starts with.
  await workoutProgramService.createDefaults(prisma, gym.id);

  await prisma.gymClosure.createMany({
    data: [
      {
        gymId: gym.id,
        startDate: dateOnly(30),
        endDate: dateOnly(32),
        reason: 'Maintenance and deep cleaning',
      },
      {
        gymId: gym.id,
        startDate: dateOnly(-40),
        endDate: dateOnly(-40),
        reason: 'National holiday',
      },
    ],
  });

  // Paid up: three monthly payments, next one due in about 20 days.
  const subscription = await prisma.gymSubscription.create({
    data: {
      gymId: gym.id,
      planName: 'Pro Monthly',
      cycle: 'monthly',
      price: '99.00',
      status: 'active',
      startDate: dateOnly(-70),
      currentPeriodEnd: dateOnly(20),
      nextPaymentDue: dateOnly(20),
    },
  });
  for (const offset of [-65, -35, -5]) {
    await prisma.gymSubscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        gymId: gym.id,
        amount: '99.00',
        paymentMethod: 'card',
        providerReference: reference('CARD'),
        paidAt: instant(offset),
      },
    });
  }
};

// ---------------------------------------------------------------------------
// Gym Beta: normal opening hours, subscription overdue
// ---------------------------------------------------------------------------

const seedBeta = async () => {
  const gym = await prisma.gym.create({
    data: {
      name: 'Beta Fitness',
      location: 'Durres',
      address: 'Bulevardi Epidamn 12, Durres',
      contactEmail: 'info@beta.test',
      contactPhone: '+355 52 223 344',
      subdomain: 'beta',
      customDomain: 'betafitness.example',
      businessHours: 'Mon-Sun 06:00-22:00',
      opensAt: '06:00',
      closesAt: '22:00',
      timezone: 'Europe/Tirane',
    },
  });
  await createUser(
    'Dritan Admin',
    'admin@beta.test',
    'gym_admin',
    gym.id,
    'Gym admin of Beta Fitness'
  );
  await createDefaultClasses(gym.id);
  await workoutProgramService.createDefaults(prisma, gym.id);
  const locations = await createLocations(gym, [
    {
      name: 'Beta Fitness',
      address: 'Bulevardi Epidamn 12, Durres',
      phone: '+355 52 223 344',
      latitude: 41.3231,
      longitude: 19.4414,
    },
  ]);

  const plans = await createPlans(gym.id);

  const bea = await createClient(gym, 'beta', 'Bea Demo', 'client', {
    note: 'Beta client: monthly membership, balance 3000',
    gender: 'female',
  });
  const beaMembership = await createMembership(gym, bea, plans.female.monthly, {
    start: -12,
  });
  await deposit(gym, bea, '3000.00', 'card', -10);
  await visits(gym, bea, beaMembership, [1, 3, 4], locations);

  const dan = await createClient(gym, 'beta', 'Dan Koci', 'dan', {
    note: 'Membership expires in 3 days',
    gender: 'male',
  });
  await createMembership(gym, dan, plans.male.monthly, { start: -27 });

  const coffee = await prisma.product.create({
    data: {
      gymId: gym.id,
      name: 'Coffee',
      category: 'drink',
      price: '1.50',
      stock: 60,
    },
  });
  await prisma.product.create({
    data: {
      gymId: gym.id,
      name: 'Energy Drink',
      category: 'drink',
      price: '2.50',
      stock: 24,
    },
  });
  await sellProduct(gym, coffee.id, '1.50', 'cash', null, -1);

  await createProgram(
    gym.id,
    'Beta Beginner Plan',
    'beginner',
    'Two easy sessions per week.',
    [
      {
        focus: 'Upper body',
        exercises: [
          {
            name: 'Chest Press Machine',
            icon: 'bench-press',
            sets: 3,
            reps: 12,
          },
          { name: 'Lat Pulldown', icon: 'lat-pulldown', sets: 3, reps: 12 },
        ],
      },
      {
        focus: 'Lower body',
        exercises: [
          { name: 'Leg Press', icon: 'leg-press', sets: 3, reps: 12 },
          {
            name: 'Walking Lunges',
            notes: 'Take long steps and keep your torso upright.',
            icon: 'lunge',
            sets: 3,
            reps: 10,
          },
        ],
      },
    ]
  );

  // Yearly plan with the due date already passed: shows as past due.
  const subscription = await prisma.gymSubscription.create({
    data: {
      gymId: gym.id,
      planName: 'Basic Yearly',
      cycle: 'yearly',
      price: '899.00',
      status: 'active',
      startDate: dateOnly(-400),
      currentPeriodEnd: dateOnly(-35),
      nextPaymentDue: dateOnly(-35),
    },
  });
  await prisma.gymSubscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      gymId: gym.id,
      amount: '899.00',
      paymentMethod: 'bank_transfer',
      providerReference: reference('BANK'),
      paidAt: instant(-400),
    },
  });
};

// ---------------------------------------------------------------------------
// Gym Gamma: deactivated by the platform
// ---------------------------------------------------------------------------

const seedGamma = async () => {
  const gym = await prisma.gym.create({
    data: {
      name: 'Gamma Studio',
      location: 'Vlore',
      address: 'Rruga Kuzum Baba 4, Vlore',
      contactEmail: 'info@gamma.test',
      subdomain: 'gamma',
      businessHours: 'Mon-Fri 08:00-20:00',
      opensAt: '08:00',
      closesAt: '20:00',
      timezone: 'Europe/Tirane',
      isActive: false,
    },
  });
  await createUser(
    'Gamma Admin',
    'admin@gamma.test',
    'gym_admin',
    gym.id,
    'Admin of a DEACTIVATED gym: API calls are blocked'
  );
  await createDefaultClasses(gym.id);
  await workoutProgramService.createDefaults(prisma, gym.id);
  await createLocations(gym, [
    {
      name: 'Gamma Studio',
      address: 'Rruga Kuzum Baba 4, Vlore',
      phone: '',
      latitude: 40.466,
      longitude: 19.4914,
    },
  ]);

  const plans = await createPlans(gym.id);
  const client = await createClient(gym, 'gamma', 'Gamma Client', 'client', {
    note: 'Client of a deactivated gym: API calls are blocked',
    gender: 'male',
  });
  await createMembership(gym, client, plans.male.monthly, { start: -5 });

  await prisma.gymSubscription.create({
    data: {
      gymId: gym.id,
      planName: 'Pro Monthly',
      cycle: 'monthly',
      price: '99.00',
      status: 'cancelled',
      startDate: dateOnly(-200),
      currentPeriodEnd: dateOnly(-90),
      nextPaymentDue: dateOnly(-90),
    },
  });
};

// Applications from gym owners waiting for the super admin (sign in as owner@platform.test > Requests).
const seedSignupRequests = async (): Promise<void> => {
  const passwordHash = await hashPassword(DEV_PASSWORD);
  await prisma.signupRequest.createMany({
    data: [
      {
        ownerName: 'Marco Rossi',
        email: 'marco@fitroma.test',
        phone: '+39 06 1234 5678',
        passwordHash,
        gymName: 'FitRoma',
        country: 'IT',
        location: 'Rome',
        address: 'Via del Corso 12, Rome',
        locationsCount: 2,
        notes: 'Two gyms in Rome, about 600 members. Website: fitroma.test',
      },
      {
        ownerName: 'Nikos Papas',
        email: 'nikos@athensgym.test',
        phone: '+30 21 0123 4567',
        passwordHash,
        gymName: 'Athens Strength Club',
        country: 'GR',
        location: 'Athens',
        address: 'Ermou 45, Athens',
        locationsCount: 1,
        status: 'rejected',
        reviewNote: 'Could not verify the business.',
        reviewedAt: instant(-3),
      },
    ],
  });
};

const main = async (): Promise<void> => {
  await clearAll();

  await createUser(
    'Platform Owner',
    'owner@platform.test',
    'super_admin',
    null,
    'Super admin: all gyms, subscriptions, billings'
  );

  await seedAlpha();
  await seedBeta();
  await seedGamma();
  await seedSignupRequests();

  console.log(
    `\nDemo data ready. Every account uses the password: ${DEV_PASSWORD}\n`
  );
  console.table(accounts);
  console.log(
    `Invite link for ilir@alpha.test (no password yet): http://localhost:5173/invite/${DEMO_INVITE_TOKEN}\n`
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
