import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { attendanceService } from '@/services/attendance';
import { checkInSchema } from '@gym/shared/validation/attendance';

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

attendanceRouter.get(
  '/stats',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await attendanceService.stats(ctx))
  )
);
