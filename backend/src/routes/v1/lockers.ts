import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { lockerService } from '@/services/lockers';
import { activeStatusSchema } from '@gym/shared/validation/common';
import {
  assignLockerSchema,
  lockerRangeSchema,
  releaseLockerSchema,
} from '@gym/shared/validation/lockers';

export const lockersRouter = Router();

lockersRouter.get(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const locationId =
      typeof req.query.locationId === 'string' && req.query.locationId
        ? req.query.locationId
        : undefined;
    return ok(await lockerService.list(ctx, locationId));
  })
);

lockersRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, lockerRangeSchema);
    return ok(await lockerService.createRange(ctx, input), 201);
  })
);

// A member puts their things in a locker (staff name the member, a member sends nothing).
lockersRouter.post(
  '/assign',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    const input = parseBody(req, assignLockerSchema);
    return ok(await lockerService.assign(ctx, input));
  })
);

lockersRouter.post(
  '/release',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    const input = parseBody(req, releaseLockerSchema);
    await lockerService.release(ctx, input);
    return ok({ released: true });
  })
);

lockersRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await lockerService.setActive(ctx, params.id, isActive));
  })
);

lockersRouter.delete(
  '/:id',
  withTenant(['gym_admin'], async (ctx, _req, params) => {
    await lockerService.remove(ctx, params.id);
    return ok({ id: params.id });
  })
);
