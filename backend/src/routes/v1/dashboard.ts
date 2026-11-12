import { Router } from 'express';
import { ok, withPlatform, withTenant } from '@/http/withTenant';
import { dashboardService } from '@/services/dashboard';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/client',
  withTenant(['client'], async (ctx) =>
    ok(await dashboardService.forClient(ctx))
  )
);

dashboardRouter.get(
  '/gym',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await dashboardService.forGym(ctx))
  )
);

dashboardRouter.get(
  '/platform',
  withPlatform(async (ctx) => ok(await dashboardService.forPlatform(ctx)))
);
