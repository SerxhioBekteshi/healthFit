import { Router } from 'express';
import { ok, withPlatform } from '@/http/withTenant';
import { gymSubscriptionService } from '@/services/gym-subscriptions';

export const billingsRouter = Router();

billingsRouter.get(
  '/',
  withPlatform(async (ctx) =>
    ok(await gymSubscriptionService.listPayments(ctx))
  )
);
