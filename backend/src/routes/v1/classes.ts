import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { classService } from '@/services/classes';
import { activeStatusSchema } from '@gym/shared/validation/common';
import { classFormSchema } from '@gym/shared/validation/classes';

export const classesRouter = Router();

classesRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await classService.list(ctx))
  )
);

classesRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, classFormSchema);
    return ok(await classService.create(ctx, input), 201);
  })
);

classesRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, classFormSchema);
    return ok(await classService.update(ctx, params.id, input));
  })
);

classesRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await classService.setActive(ctx, params.id, isActive));
  })
);

classesRouter.delete(
  '/:id',
  withTenant(['gym_admin'], async (ctx, _req, params) => {
    await classService.remove(ctx, params.id);
    return ok({ id: params.id });
  })
);
