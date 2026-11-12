import { Prisma } from '@prisma/client';
import type { BalanceTransaction as TransactionRow } from '@prisma/client';
import { chargePayment, cardMetadata, withCard } from '@/payments';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';
import { ledger } from '@/services/ledger';
import type { TenantContext } from '@/tenant/context';
import {
  addDays,
  formatDateOnly,
  parseDateOnly,
  startOfLocalDay,
} from '@/utils/dates';
import { retryOnConflict } from '@/utils/transactions';
import type {
  BalanceHistoryFilters,
  BalanceSummary,
  BalanceTransaction,
} from '@gym/shared/types';
import type { DepositValues } from '@gym/shared/validation/balance';

const HISTORY_PAGE_SIZE = 20;
const HISTORY_MAX_PAGE_SIZE = 50;

interface HistoryPage extends BalanceHistoryFilters {
  cursor?: string;
  limit?: number;
}

// The size of a transaction, so 500 matches both a 500 deposit and a -500 purchase.
const amountWhere = (
  min?: number,
  max?: number
): Prisma.BalanceTransactionWhereInput | undefined => {
  if (min === undefined && max === undefined) {
    return undefined;
  }
  const lower = min ?? 0;
  return {
    OR: [
      { amount: { gte: lower, ...(max !== undefined ? { lte: max } : {}) } },
      { amount: { lte: -lower, ...(max !== undefined ? { gte: -max } : {}) } },
    ],
  };
};

// From/to are calendar days in the gym's timezone, both inclusive.
const createdAtWhere = async (
  ctx: TenantContext,
  from?: string,
  to?: string
): Promise<Prisma.BalanceTransactionWhereInput | undefined> => {
  if (!from && !to) {
    return undefined;
  }
  const gym = await ctx.db.gym.findFirst({ where: { id: ctx.gymId } });
  const timeZone = gym?.timezone ?? 'UTC';
  return {
    createdAt: {
      ...(from ? { gte: startOfLocalDay(from, timeZone) } : {}),
      ...(to
        ? {
            lt: startOfLocalDay(
              formatDateOnly(addDays(parseDateOnly(to), 1)),
              timeZone
            ),
          }
        : {}),
    },
  };
};

const toDto = (row: TransactionRow): BalanceTransaction => ({
  id: row.id,
  gymId: row.gymId,
  clientId: row.clientId,
  type: row.type,
  amount: row.amount.toNumber(),
  paymentMethod: row.paymentMethod,
  providerStatus: row.providerStatus,
  description: row.description,
  referenceId: row.referenceId,
  createdAt: row.createdAt.toISOString(),
});

// Clients act on themselves; gym admins name a client of their own gym.
const resolveClientId = async (
  ctx: TenantContext,
  requested: string | undefined,
  options: { mustBeActive: boolean }
): Promise<string> => {
  const clientId = ctx.role === 'client' ? ctx.clientId : requested;
  if (!clientId) {
    throw new ValidationError('Select a client.');
  }
  const client = await ctx.db.client.findFirst({ where: { id: clientId } });
  if (!client) {
    throw new NotFoundError('Client not found.');
  }
  if (options.mustBeActive && !client.isActive) {
    throw new ValidationError('This client account is not active.');
  }
  return clientId;
};

export const balanceService = {
  async summary(
    ctx: TenantContext,
    requestedClientId?: string,
    page: HistoryPage = {}
  ): Promise<BalanceSummary> {
    const clientId = await resolveClientId(ctx, requestedClientId, {
      mustBeActive: false,
    });
    const take = Math.min(
      page.limit ?? HISTORY_PAGE_SIZE,
      HISTORY_MAX_PAGE_SIZE
    );
    const filters = [
      amountWhere(page.minAmount, page.maxAmount),
      await createdAtWhere(ctx, page.from, page.to),
    ].filter((filter) => filter !== undefined);
    const [balance, rows] = await Promise.all([
      // The balance is always the whole ledger, never just the filtered rows.
      ledger.balance(ctx.db, clientId),
      ctx.db.balanceTransaction.findMany({
        where: { clientId, AND: filters },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        // One extra row tells whether another page exists.
        take: take + 1,
        ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
      }),
    ]);
    const items = rows.slice(0, take);
    return {
      balance: balance.toNumber(),
      transactions: items.map(toDto),
      nextCursor: rows.length > take ? items[items.length - 1].id : null,
    };
  },

  async deposit(
    ctx: TenantContext,
    input: DepositValues,
    // Set only by the payment challenge flow once the one-time code was checked.
    options: { verified?: boolean } = {}
  ): Promise<BalanceTransaction> {
    // Cash is only ever taken at the counter by gym staff.
    if (ctx.role === 'client' && input.paymentMethod === 'cash') {
      throw new ForbiddenError('Cash deposits are made at the gym counter.');
    }
    if (
      ctx.role === 'client' &&
      input.paymentMethod === 'card' &&
      !options.verified
    ) {
      throw new ForbiddenError('Card payments need to be verified first.');
    }
    const clientId = await resolveClientId(ctx, input.clientId, {
      mustBeActive: true,
    });
    const description = withCard(
      input.description || 'Balance deposit',
      input.card
    );
    const amount = new Prisma.Decimal(input.amount.toFixed(2));

    const result = await chargePayment(input.paymentMethod, {
      amount: amount.toNumber(),
      clientId,
      description,
      metadata: {
        gymId: ctx.gymId,
        kind: 'deposit',
        ...cardMetadata(input.card),
      },
    });
    if (result.status === 'failed') {
      throw new ValidationError(result.message || 'Payment failed.');
    }

    const row = await retryOnConflict(() =>
      ctx.db.balanceTransaction.create({
        data: {
          gymId: ctx.gymId,
          clientId,
          type: 'deposit',
          amount,
          paymentMethod: input.paymentMethod,
          providerStatus: result.status === 'succeeded' ? 'paid' : 'pending',
          description,
          referenceId: result.providerReference,
        },
      })
    );
    return toDto(row);
  },
};
