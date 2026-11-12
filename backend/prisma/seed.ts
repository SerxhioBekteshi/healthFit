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
import { describeExercise } from './exercise-guides';
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
  await prisma.gymClass.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workoutDay.deleteMany();
  await prisma.workoutProgram.deleteMany();
  await prisma.productSale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.gymLocation.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.priceListNote.deleteMany();
  await prisma.paymentChallenge.deleteMany();
  await prisma.gymPhoto.deleteMany();
  await prisma.gymClosure.deleteMany();
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
      checkedInAt: minutesAgo(40),
    },
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

  // Deactivated member.
  await createClient(gym, 'alpha', 'Sara Hoxha', 'sara', {
    isActive: false,
    note: 'Deactivated client account',
    gender: 'female',
  });

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

  await createProgram(
    gym.id,
    'Full Body Starter',
    'beginner',
    'Three full-body sessions focused on the basics.',
    [
      {
        focus: 'Full Body A',
        exercises: [
          {
            name: 'Goblet Squat',
            notes: 'Hold the weight at your chest and keep your heels down.',
            icon: 'squat',
            sets: 3,
            reps: 10,
            weight: 12,
            rest: 90,
          },
          {
            name: 'Dumbbell Bench Press',
            notes: 'Lower slowly until the elbows reach chest level.',
            icon: 'bench-press',
            sets: 3,
            reps: 10,
            weight: 10,
            rest: 90,
          },
          {
            name: 'Seated Row',
            notes: 'Pull to the belly and squeeze your shoulder blades.',
            icon: 'row',
            sets: 3,
            reps: 12,
          },
          {
            name: 'Plank',
            icon: 'plank',
            sets: 3,
            reps: 30,
            rest: 45,
            notes: '30 second hold',
          },
        ],
      },
      {
        focus: 'Full Body B',
        exercises: [
          {
            name: 'Romanian Deadlift',
            notes: 'Hinge at the hips and keep the bar close to your legs.',
            icon: 'deadlift',
            sets: 3,
            reps: 10,
            weight: 30,
            rest: 90,
          },
          {
            name: 'Lat Pulldown',
            notes: 'Pull the bar to the upper chest, do not lean back.',
            icon: 'lat-pulldown',
            sets: 3,
            reps: 12,
          },
          {
            name: 'Shoulder Press',
            notes: 'Do not arch your lower back.',
            icon: 'overhead-press',
            sets: 3,
            reps: 10,
            weight: 8,
          },
        ],
      },
      {
        focus: 'Full Body C',
        exercises: [
          {
            name: 'Leg Press',
            notes: 'Do not lock your knees at the top.',
            icon: 'leg-press',
            sets: 3,
            reps: 12,
            rest: 90,
          },
          {
            name: 'Push-ups',
            notes: 'Keep your body in one straight line.',
            icon: 'push-up',
            sets: 3,
            reps: 10,
          },
          {
            name: 'Bike',
            icon: 'cardio',
            sets: 1,
            reps: 10,
            rest: 0,
            notes: '10 minutes easy',
          },
        ],
      },
    ]
  );
  await createProgram(
    gym.id,
    'Push / Pull / Legs',
    'intermediate',
    'Classic split for regular lifters.',
    [
      {
        focus: 'Push',
        exercises: [
          {
            name: 'Barbell Bench Press',
            notes: 'Warm up with two light sets first.',
            icon: 'bench-press',
            sets: 4,
            reps: 8,
            weight: 60,
            rest: 120,
          },
          {
            name: 'Overhead Press',
            notes: 'Squeeze your glutes to protect your lower back.',
            icon: 'overhead-press',
            sets: 3,
            reps: 8,
            weight: 35,
            rest: 90,
          },
          {
            name: 'Triceps Pushdown',
            notes: 'Keep your elbows pinned to your sides.',
            icon: 'triceps',
            sets: 3,
            reps: 12,
          },
        ],
      },
      {
        focus: 'Pull',
        exercises: [
          {
            name: 'Deadlift',
            notes: 'Brace your core and push the floor away.',
            icon: 'deadlift',
            sets: 3,
            reps: 5,
            weight: 90,
            rest: 150,
          },
          {
            name: 'Pull-ups',
            notes: 'Use a band for help if you cannot reach 8 reps.',
            icon: 'pull-up',
            sets: 4,
            reps: 8,
          },
          {
            name: 'Barbell Curl',
            notes: 'No swinging: keep your upper arms still.',
            icon: 'curl',
            sets: 3,
            reps: 10,
            weight: 20,
          },
        ],
      },
      {
        focus: 'Legs',
        exercises: [
          {
            name: 'Back Squat',
            notes: 'Go down until your thighs are parallel to the floor.',
            icon: 'squat',
            sets: 4,
            reps: 8,
            weight: 80,
            rest: 120,
          },
          { name: 'Leg Curl', icon: 'machine', sets: 3, reps: 12 },
          { name: 'Calf Raise', icon: 'legs', sets: 4, reps: 15 },
        ],
      },
    ]
  );
  await createProgram(
    gym.id,
    'Upper / Lower Power',
    'advanced',
    'Heavy four-day strength block.',
    [
      {
        focus: 'Upper A',
        exercises: [
          {
            name: 'Bench Press',
            icon: 'bench-press',
            sets: 5,
            reps: 5,
            weight: 85,
            rest: 150,
          },
        ],
      },
      {
        focus: 'Lower A',
        exercises: [
          {
            name: 'Back Squat',
            icon: 'squat',
            sets: 5,
            reps: 5,
            weight: 110,
            rest: 180,
          },
        ],
      },
      {
        focus: 'Upper B',
        exercises: [
          {
            name: 'Weighted Pull-up',
            icon: 'pull-up',
            sets: 4,
            reps: 6,
            weight: 10,
            rest: 120,
          },
        ],
      },
      {
        focus: 'Lower B',
        exercises: [
          {
            name: 'Deadlift',
            icon: 'deadlift',
            sets: 4,
            reps: 4,
            weight: 140,
            rest: 180,
          },
        ],
      },
    ]
  );

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

  console.log(
    `\nDemo data ready. Every account uses the password: ${DEV_PASSWORD}\n`
  );
  console.table(accounts);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
