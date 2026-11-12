import { Router } from 'express';
import { ok, parseBody, withPlatform } from '@/http/withTenant';
import { gymService } from '@/services/gyms';
import { gymFormSchema, gymStatusSchema } from '@gym/shared/validation/gyms';

export const gymsRouter = Router();

gymsRouter.get(
  '/',
  withPlatform(async (ctx) => ok(await gymService.list(ctx)))
);

gymsRouter.post(
  '/',
  withPlatform(async (ctx, req) => {
    const input = parseBody(req, gymFormSchema);
    return ok(await gymService.create(ctx, input), 201);
  })
);

gymsRouter.patch(
  '/:id',
  withPlatform(async (ctx, req, params) => {
    const input = parseBody(req, gymFormSchema);
    return ok(await gymService.update(ctx, params.id, input));
  })
);

gymsRouter.patch(
  '/:id/status',
  withPlatform(async (ctx, req, params) => {
    const { isActive } = parseBody(req, gymStatusSchema);
    return ok(await gymService.setActive(ctx, params.id, isActive));
  })
);
