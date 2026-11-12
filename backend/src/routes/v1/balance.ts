import { Router } from 'express';
import { ok, parseBody, parseQuery, withTenant } from '@/http/withTenant';
import { balanceService } from '@/services/balance';
import {
  balanceHistoryQuerySchema,
  depositSchema,
} from '@gym/shared/validation/balance';

export const balanceRouter = Router();

balanceRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    const { clientId, ...page } = parseQuery(req, balanceHistoryQuerySchema);
    return ok(await balanceService.summary(ctx, clientId, page));
  })
);

balanceRouter.post(
  '/deposit',
  withTenant(['gym_admin', 'client'], async (ctx, req) => {
    const input = parseBody(req, depositSchema);
    return ok(await balanceService.deposit(ctx, input), 201);
  })
);
