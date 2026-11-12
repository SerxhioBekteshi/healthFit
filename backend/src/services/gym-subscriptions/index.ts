import type {
  Gym as GymRow,
  GymSubscription as SubscriptionRow,
  GymSubscriptionPayment as PaymentRow,
} from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '@/errors';
import { chargePayment } from '@/payments';
import type { PlatformContext } from '@/tenant/context';
import {
  addMonths,
  formatDateOnly,
  parseDateOnly,
  todayUtc,
} from '@/utils/dates';
import type {
  GymSubscription,
  GymSubscriptionCycle,
  GymSubscriptionPayment,
  GymSubscriptionStatus,
} from '@gym/shared/types';
import type {
  CreateGymSubscriptionValues,
  SubscriptionPaymentValues,
  UpdateGymSubscriptionValues,
} from '@gym/shared/validation/gym-subscriptions';

type SubscriptionWithGym = SubscriptionRow & { gym: GymRow };
type PaymentWithRefs = PaymentRow & {
  gym: GymRow;
  subscription: SubscriptionRow;
};

const includeGym = { gym: true };

// Active subscriptions that passed their due date show as past due; trials stay trials.
export const effectiveSubscriptionStatus = (
  row: SubscriptionRow
): GymSubscriptionStatus =>
  row.status === 'active' && row.nextPaymentDue < todayUtc()
    ? 'past_due'
    : row.status;

const toDto = (row: SubscriptionWithGym): GymSubscription => ({
  id: row.id,
  gymId: row.gymId,
  gymName: row.gym.name,
  planName: row.planName,
  cycle: row.cycle,
  price: row.price.toNumber(),
  status: effectiveSubscriptionStatus(row),
  startDate: formatDateOnly(row.startDate),
  currentPeriodEnd: formatDateOnly(row.currentPeriodEnd),
  nextPaymentDue: formatDateOnly(row.nextPaymentDue),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toPaymentDto = (row: PaymentWithRefs): GymSubscriptionPayment => ({
  id: row.id,
  subscriptionId: row.subscriptionId,
  gymId: row.gymId,
  gymName: row.gym.name,
  planName: row.subscription.planName,
  amount: row.amount.toNumber(),
  paymentMethod: row.paymentMethod as GymSubscriptionPayment['paymentMethod'],
  paidAt: row.paidAt.toISOString(),
  providerReference: row.providerReference,
});

const advance = (date: Date, cycle: GymSubscriptionCycle): Date =>
  addMonths(date, cycle === 'monthly' ? 1 : 12);

const requireSubscription = async (ctx: PlatformContext, id: string) => {
  const row = await ctx.db.gymSubscription.findUnique({
    where: { id },
    include: includeGym,
  });
  if (!row) {
    throw new NotFoundError('Subscription not found.');
  }
  return row;
};

export const gymSubscriptionService = {
  async list(ctx: PlatformContext): Promise<GymSubscription[]> {
    const rows = await ctx.db.gymSubscription.findMany({
      include: includeGym,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  },

  async create(
    ctx: PlatformContext,
    input: CreateGymSubscriptionValues
  ): Promise<GymSubscription> {
    const gym = await ctx.db.gym.findUnique({ where: { id: input.gymId } });
    if (!gym) {
      throw new NotFoundError('Gym not found.');
    }
    const existing = await ctx.db.gymSubscription.findFirst({
      where: { gymId: input.gymId },
    });
    if (existing) {
      throw new ConflictError('This gym already has a subscription.');
    }

    // Nothing is paid yet: the paid-through date starts at the start date.
    const start = parseDateOnly(input.startDate);
    const row = await ctx.db.gymSubscription.create({
      data: {
        gymId: input.gymId,
        planName: input.planName,
        cycle: input.cycle,
        price: input.price.toFixed(2),
        status: 'trialing',
        startDate: start,
        currentPeriodEnd: start,
        nextPaymentDue: start,
      },
      include: includeGym,
    });
    return toDto(row);
  },

  async update(
    ctx: PlatformContext,
    id: string,
    input: UpdateGymSubscriptionValues
  ): Promise<GymSubscription> {
    await requireSubscription(ctx, id);
    const row = await ctx.db.gymSubscription.update({
      where: { id },
      data: {
        planName: input.planName,
        cycle: input.cycle,
        price: input.price.toFixed(2),
      },
      include: includeGym,
    });
    return toDto(row);
  },

  async setStatus(
    ctx: PlatformContext,
    id: string,
    status: 'active' | 'cancelled'
  ): Promise<GymSubscription> {
    await requireSubscription(ctx, id);
    const row = await ctx.db.gymSubscription.update({
      where: { id },
      data: { status },
      include: includeGym,
    });
    return toDto(row);
  },

  // Settles exactly one billing period at the current plan price.
  async recordPayment(
    ctx: PlatformContext,
    id: string,
    input: SubscriptionPaymentValues
  ): Promise<GymSubscription> {
    const subscription = await requireSubscription(ctx, id);
    if (subscription.status === 'cancelled') {
      throw new ValidationError('This subscription is cancelled.');
    }

    let providerReference = '';
    // A bank transfer is recorded by the platform owner once the money has arrived.
    if (input.paymentMethod === 'bank_transfer') {
      providerReference = `BANK-${Date.now().toString(36).toUpperCase()}`;
    } else {
      const result = await chargePayment(input.paymentMethod, {
        amount: subscription.price.toNumber(),
        clientId: subscription.gymId,
        description: `Gym subscription: ${subscription.planName}`,
        metadata: { subscriptionId: id, gymId: subscription.gymId },
      });
      if (result.status !== 'succeeded') {
        throw new ValidationError(result.message || 'Payment failed.');
      }
      providerReference = result.providerReference;
    }

    const paidThrough = advance(
      subscription.currentPeriodEnd,
      subscription.cycle
    );
    await ctx.db.$transaction(async (tx) => {
      // Conditional on the period we read, so two concurrent payments cannot both claim it.
      const claimed = await tx.gymSubscription.updateMany({
        where: { id, currentPeriodEnd: subscription.currentPeriodEnd },
        data: {
          status: 'active',
          currentPeriodEnd: paidThrough,
          nextPaymentDue: paidThrough,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictError(
          'The subscription changed while recording the payment. Please retry.'
        );
      }
      await tx.gymSubscriptionPayment.create({
        data: {
          subscriptionId: id,
          gymId: subscription.gymId,
          amount: subscription.price,
          paymentMethod: input.paymentMethod,
          providerReference,
        },
      });
    });

    return toDto(await requireSubscription(ctx, id));
  },

  async listPayments(ctx: PlatformContext): Promise<GymSubscriptionPayment[]> {
    const rows = await ctx.db.gymSubscriptionPayment.findMany({
      include: { gym: true, subscription: true },
      orderBy: { paidAt: 'desc' },
      take: 200,
    });
    return rows.map(toPaymentDto);
  },
};
