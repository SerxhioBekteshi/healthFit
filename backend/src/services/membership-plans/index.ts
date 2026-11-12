import type { MembershipPlan as PlanRow } from '@prisma/client';
import { NotFoundError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type { MembershipPlan } from '@gym/shared/types';
import type {
  MembershipPlanFormValues,
  PriceGridValues,
} from '@gym/shared/validation/membership-plans';

const TERMS = {
  monthly: { days: 30, label: '1 Month' },
  three_months: { days: 90, label: '3 Months' },
  six_months: { days: 180, label: '6 Months' },
  yearly: { days: 365, label: '12 Months' },
} as const;

export const toPlanDto = (row: PlanRow): MembershipPlan => ({
  id: row.id,
  gymId: row.gymId,
  name: row.name,
  type: row.type,
  durationDays: row.durationDays,
  visitCount: row.visitCount,
  gender: row.gender,
  weeklyVisits: row.weeklyVisits,
  price: row.price.toNumber(),
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const planData = (input: MembershipPlanFormValues) => ({
  name: input.name,
  type: input.type,
  durationDays: input.durationDays,
  // Only visit-based plans carry a visit count.
  visitCount: input.type === 'visit_based' ? input.visitCount : 0,
  gender: input.gender,
  // Visit packs are capped by their visit count, not per week.
  weeklyVisits: input.type === 'visit_based' ? 0 : input.weeklyVisits,
  price: input.price.toFixed(2),
});

export const membershipPlanService = {
  async list(ctx: TenantContext): Promise<MembershipPlan[]> {
    // Clients only see active plans sold to their gender.
    const clientGender =
      ctx.role === 'client'
        ? (await ctx.db.client.findFirst({ where: { id: ctx.clientId ?? '' } }))
            ?.gender
        : undefined;
    if (ctx.role === 'client' && !clientGender) {
      return [];
    }

    const rows = await ctx.db.membershipPlan.findMany({
      where:
        ctx.role === 'client'
          ? { isActive: true, gender: clientGender ?? undefined }
          : {},
      orderBy: [
        { gender: 'asc' },
        { weeklyVisits: 'asc' },
        { durationDays: 'asc' },
      ],
    });
    return rows.map(toPlanDto);
  },

  async create(
    ctx: TenantContext,
    input: MembershipPlanFormValues
  ): Promise<MembershipPlan> {
    const row = await ctx.db.membershipPlan.create({
      data: { gymId: ctx.gymId, ...planData(input) },
    });
    return toPlanDto(row);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: MembershipPlanFormValues
  ): Promise<MembershipPlan> {
    const result = await ctx.db.membershipPlan.updateMany({
      where: { id },
      data: planData(input),
    });
    if (result.count === 0) {
      throw new NotFoundError('Membership plan not found.');
    }
    return membershipPlanService.get(ctx, id);
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean
  ): Promise<MembershipPlan> {
    const result = await ctx.db.membershipPlan.updateMany({
      where: { id },
      data: { isActive },
    });
    if (result.count === 0) {
      throw new NotFoundError('Membership plan not found.');
    }
    return membershipPlanService.get(ctx, id);
  },

  async get(ctx: TenantContext, id: string): Promise<MembershipPlan> {
    const row = await ctx.db.membershipPlan.findFirst({ where: { id } });
    if (!row) {
      throw new NotFoundError('Membership plan not found.');
    }
    return toPlanDto(row);
  },

  // Saves the standard price table of one gender: a plan per (weekly visits, term) cell.
  // Empty cells are deactivated, not deleted, because memberships reference their plan.
  async savePriceGrid(
    ctx: TenantContext,
    input: PriceGridValues
  ): Promise<MembershipPlan[]> {
    await ctx.db.$transaction(async (tx) => {
      for (const cell of input.cells) {
        const matches = (
          await tx.membershipPlan.findMany({
            where: {
              gender: input.gender,
              type: cell.type,
              weeklyVisits: cell.weeklyVisits,
            },
            orderBy: { createdAt: 'asc' },
          })
        ).sort((a, b) => Number(b.isActive) - Number(a.isActive));
        const price = cell.price ?? 0;

        if (price <= 0) {
          if (matches.length > 0) {
            await tx.membershipPlan.updateMany({
              where: { id: { in: matches.map((plan) => plan.id) } },
              data: { isActive: false },
            });
          }
          continue;
        }

        const [primary, ...duplicates] = matches;
        if (!primary) {
          const term = TERMS[cell.type];
          await tx.membershipPlan.create({
            data: {
              gymId: ctx.gymId,
              name: `${cell.weeklyVisits > 0 ? `${cell.weeklyVisits}x / week` : 'Unlimited'} - ${term.label}`,
              type: cell.type,
              durationDays: term.days,
              visitCount: 0,
              gender: input.gender,
              weeklyVisits: cell.weeklyVisits,
              price: price.toFixed(2),
            },
          });
          continue;
        }

        await tx.membershipPlan.updateMany({
          where: { id: primary.id },
          data: { price: price.toFixed(2), isActive: true },
        });
        if (duplicates.length > 0) {
          await tx.membershipPlan.updateMany({
            where: { id: { in: duplicates.map((plan) => plan.id) } },
            data: { isActive: false },
          });
        }
      }
    });
    return membershipPlanService.list(ctx);
  },
};
