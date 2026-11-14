import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { attendanceService } from '@/services/attendance';
import {
  checkInSchema,
  checkOutSchema,
  scanSchema,
} from '@gym/shared/validation/attendance';

export const attendanceRouter = Router();

attendanceRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    // Optional `?limit=10` for screens that only need the latest rows.
    const limit = Number(req.query.limit);
    return ok(
      await attendanceService.list(
        ctx,
        Number.isInteger(limit) && limit > 0 ? limit : undefined
      )
    );
  })
);

attendanceRouter.get(
  '/history',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    const cursor =
      typeof req.query.cursor === 'string' && req.query.cursor
        ? req.query.cursor
        : undefined;
    const limit = Number(req.query.limit);
    return ok(
      await attendanceService.history(ctx, {
        cursor,
        limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
      })
    );
  })
);

attendanceRouter.post(
  '/check-in',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    const { clientId, locationId } = parseBody(req, checkInSchema);
    return ok(
      await attendanceService.checkIn(ctx, clientId, new Date(), locationId),
      201
    );
  })
);

attendanceRouter.post(
  '/scan',
  withTenant(['gym_admin'], async (ctx, req) => {
    const { code, locationId } = parseBody(req, scanSchema);
    return ok(await attendanceService.scan(ctx, code, new Date(), locationId));
  })
);

attendanceRouter.post(
  '/check-out',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    const { clientId } = parseBody(req, checkOutSchema);
    return ok(await attendanceService.checkOut(ctx, clientId));
  })
);

attendanceRouter.get(
  '/stats',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await attendanceService.stats(ctx))
  )
);
