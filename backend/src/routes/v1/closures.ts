import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { gymClosureService } from '@/services/gym-closures';
import { gymClosureFormSchema } from '@gym/shared/validation/gym-closures';

export const closuresRouter = Router();

closuresRouter.get(
  '/',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await gymClosureService.list(ctx))
  )
);

closuresRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, gymClosureFormSchema);
    return ok(await gymClosureService.create(ctx, input), 201);
  })
);

closuresRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, gymClosureFormSchema);
    return ok(await gymClosureService.update(ctx, params.id, input));
  })
);

closuresRouter.delete(
  '/:id',
  withTenant(['gym_admin'], async (ctx, _req, params) => {
    await gymClosureService.remove(ctx, params.id);
    return ok({ id: params.id });
  })
);
