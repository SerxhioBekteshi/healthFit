import { Prisma } from '@prisma/client';
import type {
  MembershipPlan as PlanRow,
  PriceOffer as OfferRow,
  PriceOfferItem as ItemRow,
} from '@prisma/client';
import { NotFoundError, ValidationError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import { formatDateOnly, localParts, parseDateOnly } from '@/utils/dates';
import type {
  PlanOffer,
  PriceOffer,
  PriceOfferStatus,
} from '@gym/shared/types';
import type { PriceOfferFormValues } from '@gym/shared/validation/price-offers';

type OfferWithItems = OfferRow & { items: (ItemRow & { plan: PlanRow })[] };

const withItems = { items: { include: { plan: true } } };

const gymToday = async (ctx: TenantContext): Promise<string> => {
  const gym = await ctx.db.gym.findFirst({ select: { timezone: true } });
  return localParts(new Date(), gym?.timezone ?? 'UTC').date;
};

const statusOf = (row: OfferRow, today: string): PriceOfferStatus => {
  if (formatDateOnly(row.endDate) < today) return 'ended';
  if (!row.isActive) return 'paused';
  return formatDateOnly(row.startDate) > today ? 'scheduled' : 'active';
};

const toDto = (row: OfferWithItems, today: string): PriceOffer => ({
  id: row.id,
  gymId: row.gymId,
  name: row.name,
  startDate: formatDateOnly(row.startDate),
  endDate: formatDateOnly(row.endDate),
  isActive: row.isActive,
  status: statusOf(row, today),
  items: row.items.map((item) => ({
    planId: item.planId,
    planName: item.plan.name,
    regularPrice: item.plan.price.toNumber(),
    price: item.price.toNumber(),
  })),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

// Offers can only lower a price; a plan whose regular price fell below the offer ignores it.
const assertLower = (
  plans: Map<string, PlanRow>,
  items: PriceOfferFormValues['items']
): void => {
  for (const item of items) {
    const plan = plans.get(item.planId);
    if (!plan) {
      throw new NotFoundError('Membership plan not found.');
    }
    if (item.price >= plan.price.toNumber()) {
      throw new ValidationError(
        'The offer price must be lower than the regular price.'
      );
    }
  }
};

const requirePlans = async (
  ctx: TenantContext,
  items: PriceOfferFormValues['items']
): Promise<Map<string, PlanRow>> => {
  const rows = await ctx.db.membershipPlan.findMany({
    where: { id: { in: items.map((item) => item.planId) } },
  });
  return new Map(rows.map((row) => [row.id, row]));
};

const itemRows = (
  ctx: TenantContext,
  offerId: string,
  items: PriceOfferFormValues['items']
) =>
  items.map((item) => ({
    gymId: ctx.gymId,
    offerId,
    planId: item.planId,
    price: item.price.toFixed(2),
  }));

export const priceOfferService = {
  async list(ctx: TenantContext): Promise<PriceOffer[]> {
    const [rows, today] = await Promise.all([
      ctx.db.priceOffer.findMany({
        include: withItems,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      }),
      gymToday(ctx),
    ]);
    return rows.map((row) => toDto(row, today));
  },

  async create(
    ctx: TenantContext,
    input: PriceOfferFormValues
  ): Promise<PriceOffer> {
    assertLower(await requirePlans(ctx, input.items), input.items);
    const id = await ctx.db.$transaction(async (tx) => {
      const offer = await tx.priceOffer.create({
        data: {
          gymId: ctx.gymId,
          name: input.name,
          startDate: parseDateOnly(input.startDate),
          endDate: parseDateOnly(input.endDate),
        },
      });
      await tx.priceOfferItem.createMany({
        data: itemRows(ctx, offer.id, input.items),
      });
      return offer.id;
    });
    return priceOfferService.get(ctx, id);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: PriceOfferFormValues
  ): Promise<PriceOffer> {
    assertLower(await requirePlans(ctx, input.items), input.items);
    await ctx.db.$transaction(async (tx) => {
      const result = await tx.priceOffer.updateMany({
        where: { id },
        data: {
          name: input.name,
          startDate: parseDateOnly(input.startDate),
          endDate: parseDateOnly(input.endDate),
        },
      });
      if (result.count === 0) {
        throw new NotFoundError('Offer not found.');
      }
      await tx.priceOfferItem.deleteMany({ where: { offerId: id } });
      await tx.priceOfferItem.createMany({
        data: itemRows(ctx, id, input.items),
      });
    });
    return priceOfferService.get(ctx, id);
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean
  ): Promise<PriceOffer> {
    const result = await ctx.db.priceOffer.updateMany({
      where: { id },
      data: { isActive },
    });
    if (result.count === 0) {
      throw new NotFoundError('Offer not found.');
    }
    return priceOfferService.get(ctx, id);
  },

  // Memberships already bought keep the price they paid, so deleting an offer is safe.
  async remove(ctx: TenantContext, id: string): Promise<void> {
    const result = await ctx.db.priceOffer.deleteMany({ where: { id } });
    if (result.count === 0) {
      throw new NotFoundError('Offer not found.');
    }
  },

  async get(ctx: TenantContext, id: string): Promise<PriceOffer> {
    const row = await ctx.db.priceOffer.findFirst({
      where: { id },
      include: withItems,
    });
    if (!row) {
      throw new NotFoundError('Offer not found.');
    }
    return toDto(row, await gymToday(ctx));
  },

  // Lowest valid offer per plan today; the server alone decides what a purchase costs.
  async currentByPlan(
    ctx: TenantContext
  ): Promise<Map<string, { offer: OfferRow; price: Prisma.Decimal }>> {
    const day = parseDateOnly(await gymToday(ctx));
    const items = await ctx.db.priceOfferItem.findMany({
      where: {
        offer: {
          isActive: true,
          startDate: { lte: day },
          endDate: { gte: day },
        },
      },
      include: { offer: true, plan: true },
    });
    const best = new Map<string, { offer: OfferRow; price: Prisma.Decimal }>();
    for (const item of items) {
      const current = best.get(item.planId);
      if (
        item.price.lessThan(item.plan.price) &&
        (!current || item.price.lessThan(current.price))
      ) {
        best.set(item.planId, { offer: item.offer, price: item.price });
      }
    }
    return best;
  },

  async offersByPlan(ctx: TenantContext): Promise<Map<string, PlanOffer>> {
    const current = await priceOfferService.currentByPlan(ctx);
    return new Map(
      [...current].map(([planId, { offer, price }]) => [
        planId,
        {
          id: offer.id,
          name: offer.name,
          price: price.toNumber(),
          startDate: formatDateOnly(offer.startDate),
          endDate: formatDateOnly(offer.endDate),
        },
      ])
    );
  },

  // What a member pays for the plan right now.
  async priceFor(ctx: TenantContext, plan: PlanRow): Promise<Prisma.Decimal> {
    const current = await priceOfferService.currentByPlan(ctx);
    return current.get(plan.id)?.price ?? plan.price;
  },
};
