import { Router } from 'express';
import { ok, parseBody, parseQuery, withTenant } from '@/http/withTenant';
import { membershipService } from '@/services/memberships';
import {
  createMembershipSchema,
  membershipHistoryQuerySchema,
  renewMembershipSchema,
  subscribeMembershipSchema,
} from '@gym/shared/validation/memberships';

export const membershipsRouter = Router();

membershipsRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await membershipService.list(ctx))
  )
);

membershipsRouter.get(
  '/history',
  withTenant(['gym_admin', 'client'], async (ctx, req) =>
    ok(
      await membershipService.history(
        ctx,
        parseQuery(req, membershipHistoryQuerySchema)
      )
    )
  )
);

membershipsRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, createMembershipSchema);
    return ok(await membershipService.create(ctx, input), 201);
  })
);

membershipsRouter.post(
  '/subscribe',
  withTenant(['client'], async (ctx, req) => {
    const input = parseBody(req, subscribeMembershipSchema);
    return ok(await membershipService.subscribe(ctx, input), 201);
  })
);

membershipsRouter.post(
  '/:id/confirm-payment',
  withTenant(['gym_admin'], async (ctx, _req, params) =>
    ok(await membershipService.confirmPayment(ctx, params.id))
  )
);

membershipsRouter.post(
  '/:id/cancel',
  withTenant(['gym_admin'], async (ctx, _req, params) =>
    ok(await membershipService.cancel(ctx, params.id))
  )
);

membershipsRouter.post(
  '/:id/renew',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, renewMembershipSchema);
    return ok(await membershipService.renew(ctx, params.id, input), 201);
  })
);
