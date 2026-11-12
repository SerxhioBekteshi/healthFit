import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { membershipPlanService } from '@/services/membership-plans';
import { activeStatusSchema } from '@gym/shared/validation/common';
import {
  membershipPlanFormSchema,
  priceGridSchema,
} from '@gym/shared/validation/membership-plans';

export const membershipPlansRouter = Router();

// Whole standard price table of one gender in one call.
membershipPlansRouter.put(
  '/price-grid',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, priceGridSchema);
    return ok(await membershipPlanService.savePriceGrid(ctx, input));
  })
);

membershipPlansRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await membershipPlanService.list(ctx))
  )
);

membershipPlansRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, membershipPlanFormSchema);
    return ok(await membershipPlanService.create(ctx, input), 201);
  })
);

membershipPlansRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, membershipPlanFormSchema);
    return ok(await membershipPlanService.update(ctx, params.id, input));
  })
);

membershipPlansRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await membershipPlanService.setActive(ctx, params.id, isActive));
  })
);
