import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type {
  Client as ClientRow,
  Membership as MembershipRow,
  MembershipPlan as PlanRow,
  PaymentMethod,
} from '@prisma/client';
import { chargePayment, cardMetadata, withCard } from '@/payments';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';
import { ledger } from '@/services/ledger';
import type { TenantContext } from '@/tenant/context';
import type { TenantDb } from '@/tenant/scopedDb';
import {
  addDays,
  formatDateOnly,
  parseDateOnly,
  todayUtc,
} from '@/utils/dates';
import { retryOnConflict } from '@/utils/transactions';
import type {
  CardSummary,
  Membership,
  MembershipHistoryFilters,
  MembershipHistoryPage,
  MembershipStatus,
} from '@gym/shared/types';
import type {
  CreateMembershipValues,
  RenewMembershipValues,
  SubscribeMembershipValues,
} from '@gym/shared/validation/memberships';

const HISTORY_PAGE_SIZE = 20;
const HISTORY_MAX_PAGE_SIZE = 50;

// `upcoming` and `expired` are derived from the dates, so they are matched by the dates.
const statusWhere = (
  status: MembershipStatus,
  today: Date
): Prisma.MembershipWhereInput => {
  switch (status) {
    case 'active':
      return {
        status: 'active',
        startDate: { lte: today },
        endDate: { gte: today },
      };
    case 'upcoming':
      return { status: 'active', startDate: { gt: today } };
    case 'expired':
      return { status: 'active', endDate: { lt: today } };
    default:
      return { status };
  }
};

// A membership matches a range when its period overlaps it.
const overlapWhere = (
  from?: string,
  to?: string
): Prisma.MembershipWhereInput => ({
  ...(from ? { endDate: { gte: parseDateOnly(from) } } : {}),
  ...(to ? { startDate: { lte: parseDateOnly(to) } } : {}),
});

// The API only lets staff record cash; the service itself can settle any method.
type WithMethod<T extends { paymentMethod: unknown }> = Omit<
  T,
  'paymentMethod'
> & { paymentMethod: PaymentMethod };

const effectiveStatus = (row: MembershipRow): MembershipStatus => {
  if (row.status !== 'active') {
    return row.status;
  }
  const today = todayUtc();
  if (row.endDate < today) {
    return 'expired';
  }
  return row.startDate > today ? 'upcoming' : 'active';
};

const toDto = (row: MembershipRow): Membership => ({
  id: row.id,
  gymId: row.gymId,
  clientId: row.clientId,
  planId: row.planId,
  planName: row.planName,
  planType: row.planType,
  weeklyVisits: row.weeklyVisits,
  startDate: formatDateOnly(row.startDate),
  endDate: formatDateOnly(row.endDate),
  price: row.price.toNumber(),
  paymentMethod: row.paymentMethod,
  paymentStatus: row.paymentStatus,
  paymentReference: row.paymentReference,
  status: effectiveStatus(row),
  visitsRemaining: row.visitsRemaining,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

interface PlacementInput {
  client: ClientRow;
  plan: PlanRow;
  startDate: string;
  method: PaymentMethod;
  description: string;
  // Brand and last 4 digits of the card the client entered; never the full number.
  card?: CardSummary;
}

// A new membership never overlaps a paid one: it starts the day after the last one ends.
const queuedStart = async (
  db: Pick<TenantDb, 'membership'>,
  clientId: string,
  requested: Date
): Promise<Date> => {
  const last = await db.membership.findFirst({
    where: { clientId, status: 'active', endDate: { gte: requested } },
    orderBy: { endDate: 'desc' },
  });
  return last ? addDays(last.endDate, 1) : requested;
};

// Charges (or debits the balance) and records membership + ledger row in one transaction.
const placeMembership = async (
  ctx: TenantContext,
  input: PlacementInput
): Promise<MembershipRow> => {
  const { client, plan, method } = input;
  const description = withCard(input.description, input.card);
  if (client.gender && client.gender !== plan.gender) {
    throw new ValidationError(`This plan is for ${plan.gender} members only.`);
  }
  const requestedStart = parseDateOnly(input.startDate);
  let providerReference = '';
  let settled = method === 'balance';

  if (method !== 'balance') {
    const result = await chargePayment(method, {
      amount: plan.price.toNumber(),
      clientId: client.id,
      description,
      metadata: {
        gymId: ctx.gymId,
        planId: plan.id,
        kind: 'membership',
        ...cardMetadata(input.card),
      },
    });
    if (result.status === 'failed') {
      throw new ValidationError(result.message || 'Payment failed.');
    }
    providerReference = result.providerReference;
    settled = result.status === 'succeeded';
  }

  return retryOnConflict(() =>
    ctx.db.$transaction(
      async (tx) => {
        let amount = new Prisma.Decimal(0);
        let reference = providerReference;

        if (method === 'balance') {
          const balance = await ledger.balance(tx, client.id);
          if (balance.lessThan(plan.price)) {
            throw new ValidationError(
              'Client balance is insufficient to cover this membership.'
            );
          }
          amount = plan.price.negated();
          reference = `BAL-${randomBytes(4).toString('hex').toUpperCase()}`;
        }

        // Read inside the serializable transaction so two purchases cannot take the same slot.
        const start = await queuedStart(tx, client.id, requestedStart);
        const end = addDays(start, plan.durationDays);

        const membership = await tx.membership.create({
          data: {
            gymId: ctx.gymId,
            clientId: client.id,
            planId: plan.id,
            planName: plan.name,
            planType: plan.type,
            weeklyVisits: plan.weeklyVisits,
            startDate: start,
            endDate: end,
            price: plan.price,
            paymentMethod: method,
            paymentStatus: settled ? 'paid' : 'pending',
            paymentReference: reference,
            status: settled ? 'active' : 'pending',
            visitsRemaining: plan.type === 'visit_based' ? plan.visitCount : 0,
          },
        });

        await tx.balanceTransaction.create({
          data: {
            gymId: ctx.gymId,
            clientId: client.id,
            type: 'membership',
            amount,
            paymentMethod: method,
            providerStatus: settled ? 'paid' : 'pending',
            description,
            referenceId: reference,
          },
        });

        return membership;
      },
      { isolationLevel: 'Serializable' }
    )
  );
};

const requireMembership = async (
  ctx: TenantContext,
  id: string
): Promise<MembershipRow> => {
  const row = await ctx.db.membership.findFirst({ where: { id } });
  if (!row) {
    throw new NotFoundError('Membership not found.');
  }
  return row;
};

export const membershipService = {
  async list(ctx: TenantContext): Promise<Membership[]> {
    const rows = await ctx.db.membership.findMany({
      // Clients only ever see their own memberships.
      where: ctx.role === 'client' ? { clientId: ctx.clientId ?? '' } : {},
      orderBy: { startDate: 'desc' },
    });
    return rows.map(toDto);
  },

  async history(
    ctx: TenantContext,
    page: MembershipHistoryFilters & { cursor?: string; limit?: number } = {}
  ): Promise<MembershipHistoryPage> {
    const take = Math.min(
      Math.max(page.limit ?? HISTORY_PAGE_SIZE, 1),
      HISTORY_MAX_PAGE_SIZE
    );
    const rows = await ctx.db.membership.findMany({
      where: {
        // Clients only ever see their own memberships.
        ...(ctx.role === 'client' ? { clientId: ctx.clientId ?? '' } : {}),
        AND: [
          page.status ? statusWhere(page.status, todayUtc()) : {},
          overlapWhere(page.from, page.to),
        ],
      },
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      // One extra row tells whether another page exists.
      take: take + 1,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    });
    const items = rows.slice(0, take);
    return {
      memberships: items.map(toDto),
      nextCursor: rows.length > take ? items[items.length - 1].id : null,
    };
  },

  async create(
    ctx: TenantContext,
    input: WithMethod<CreateMembershipValues>
  ): Promise<Membership> {
    const client = await ctx.db.client.findFirst({
      where: { id: input.clientId, isActive: true },
    });
    if (!client) {
      throw new NotFoundError('Client not found or inactive.');
    }
    const plan = await ctx.db.membershipPlan.findFirst({
      where: { id: input.planId, isActive: true },
    });
    if (!plan) {
      throw new NotFoundError('Membership plan not found or inactive.');
    }

    const row = await placeMembership(ctx, {
      client,
      plan,
      startDate: input.startDate,
      method: input.paymentMethod,
      description: `Membership: ${plan.name}`,
    });
    return toDto(row);
  },

  // Self-service purchase by the signed-in client; the client always comes from the session.
  async subscribe(
    ctx: TenantContext,
    input: SubscribeMembershipValues,
    // Set only by the payment challenge flow once the one-time code was checked.
    options: { verified?: boolean } = {}
  ): Promise<Membership> {
    if (input.paymentMethod === 'card' && !options.verified) {
      throw new ForbiddenError('Card payments need to be verified first.');
    }
    const client = await ctx.db.client.findFirst({
      where: { id: ctx.clientId ?? '', isActive: true },
    });
    if (!client) {
      throw new NotFoundError('Client not found or inactive.');
    }
    if (!client.gender) {
      throw new ValidationError(
        'Your gym has not set your gender yet. Ask them to update your profile.'
      );
    }
    const plan = await ctx.db.membershipPlan.findFirst({
      where: { id: input.planId, isActive: true },
    });
    if (!plan) {
      throw new NotFoundError('Membership plan not found or inactive.');
    }

    const pending = await ctx.db.membership.findFirst({
      where: { clientId: client.id, status: 'pending' },
    });
    if (pending) {
      throw new ValidationError(
        'You already have a membership waiting for payment confirmation.'
      );
    }

    // placeMembership queues the plan after the client's running memberships.
    const row = await placeMembership(ctx, {
      client,
      plan,
      startDate: formatDateOnly(todayUtc()),
      method: input.paymentMethod,
      description: `Membership: ${plan.name}`,
      card: input.card,
    });
    return toDto(row);
  },

  async renew(
    ctx: TenantContext,
    id: string,
    input: WithMethod<RenewMembershipValues>
  ): Promise<Membership> {
    const previous = await requireMembership(ctx, id);
    const client = await ctx.db.client.findFirst({
      where: { id: previous.clientId, isActive: true },
    });
    if (!client) {
      throw new NotFoundError('Client not found or inactive.');
    }
    const plan = await ctx.db.membershipPlan.findFirst({
      where: { id: previous.planId },
    });
    if (!plan) {
      throw new NotFoundError('Membership plan not found.');
    }

    const row = await placeMembership(ctx, {
      client,
      plan,
      startDate: input.startDate,
      method: input.paymentMethod,
      description: `Renewal: ${plan.name}`,
    });
    return toDto(row);
  },

  async cancel(ctx: TenantContext, id: string): Promise<Membership> {
    await requireMembership(ctx, id);
    await ctx.db.membership.updateMany({
      where: { id },
      data: { status: 'cancelled' },
    });
    return toDto(await requireMembership(ctx, id));
  },

  // Settles a pending payment (e.g. a bank transfer) after the gym verified it.
  async confirmPayment(ctx: TenantContext, id: string): Promise<Membership> {
    const row = await requireMembership(ctx, id);
    if (row.paymentStatus !== 'pending' || row.status !== 'pending') {
      throw new ValidationError('This membership has no pending payment.');
    }

    await ctx.db.$transaction(async (tx) => {
      await tx.membership.updateMany({
        where: { id },
        data: { paymentStatus: 'paid', status: 'active' },
      });
      await tx.balanceTransaction.updateMany({
        where: {
          clientId: row.clientId,
          type: 'membership',
          referenceId: row.paymentReference,
          providerStatus: 'pending',
        },
        data: { providerStatus: 'paid' },
      });
    });
    return toDto(await requireMembership(ctx, id));
  },

  // Membership that currently allows entry: started, not ended, and visits left for visit packs.
  async findActiveForClient(
    db: Pick<TenantDb, 'membership'>,
    clientId: string,
    on: Date = todayUtc()
  ): Promise<MembershipRow | null> {
    const today = on;
    return db.membership.findFirst({
      where: {
        clientId,
        status: 'active',
        startDate: { lte: today },
        endDate: { gte: today },
        OR: [
          { planType: { not: 'visit_based' } },
          { visitsRemaining: { gt: 0 } },
        ],
      },
      orderBy: { endDate: 'desc' },
    });
  },
};
