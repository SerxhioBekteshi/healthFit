import { Router } from 'express';
import { ok, parseBody, withPlatform } from '@/http/withTenant';
import { gymSubscriptionService } from '@/services/gym-subscriptions';
import {
  createGymSubscriptionSchema,
  subscriptionPaymentSchema,
  subscriptionStatusSchema,
  updateGymSubscriptionSchema,
} from '@gym/shared/validation/gym-subscriptions';

export const gymSubscriptionsRouter = Router();

gymSubscriptionsRouter.get(
  '/',
  withPlatform(async (ctx) => ok(await gymSubscriptionService.list(ctx)))
);

gymSubscriptionsRouter.post(
  '/',
  withPlatform(async (ctx, req) => {
    const input = parseBody(req, createGymSubscriptionSchema);
    return ok(await gymSubscriptionService.create(ctx, input), 201);
  })
);

gymSubscriptionsRouter.patch(
  '/:id',
  withPlatform(async (ctx, req, params) => {
    const input = parseBody(req, updateGymSubscriptionSchema);
    return ok(await gymSubscriptionService.update(ctx, params.id, input));
  })
);

gymSubscriptionsRouter.patch(
  '/:id/status',
  withPlatform(async (ctx, req, params) => {
    const { status } = parseBody(req, subscriptionStatusSchema);
    return ok(await gymSubscriptionService.setStatus(ctx, params.id, status));
  })
);

gymSubscriptionsRouter.post(
  '/:id/payments',
  withPlatform(async (ctx, req, params) => {
    const input = parseBody(req, subscriptionPaymentSchema);
    return ok(
      await gymSubscriptionService.recordPayment(ctx, params.id, input),
      201
    );
  })
);
