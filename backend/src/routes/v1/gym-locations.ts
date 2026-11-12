import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { gymLocationService } from '@/services/gym-locations';
import { activeStatusSchema } from '@gym/shared/validation/common';
import { gymLocationFormSchema } from '@gym/shared/validation/gym-locations';

export const gymLocationsRouter = Router();

gymLocationsRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await gymLocationService.list(ctx))
  )
);

gymLocationsRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, gymLocationFormSchema);
    return ok(await gymLocationService.create(ctx, input), 201);
  })
);

gymLocationsRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, gymLocationFormSchema);
    return ok(await gymLocationService.update(ctx, params.id, input));
  })
);

gymLocationsRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await gymLocationService.setActive(ctx, params.id, isActive));
  })
);
