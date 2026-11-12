import { Router } from 'express';
import { ok, parseBody, withPlatform } from '@/http/withTenant';
import { gymAdminService } from '@/services/gym-admins';
import {
  createGymAdminSchema,
  updateGymAdminSchema,
} from '@gym/shared/validation/gym-admins';

export const gymAdminsRouter = Router();

gymAdminsRouter.get(
  '/',
  withPlatform(async (ctx) => ok(await gymAdminService.list(ctx)))
);

gymAdminsRouter.post(
  '/',
  withPlatform(async (ctx, req) => {
    const input = parseBody(req, createGymAdminSchema);
    return ok(await gymAdminService.create(ctx, input), 201);
  })
);

gymAdminsRouter.patch(
  '/:id',
  withPlatform(async (ctx, req, params) => {
    const input = parseBody(req, updateGymAdminSchema);
    return ok(await gymAdminService.update(ctx, params.id, input));
  })
);

gymAdminsRouter.delete(
  '/:id',
  withPlatform(async (ctx, _req, params) => {
    await gymAdminService.remove(ctx, params.id);
    return ok({ id: params.id });
  })
);
