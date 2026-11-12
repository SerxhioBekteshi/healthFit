import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { paymentChallengeService } from '@/services/payment-challenges';
import {
  startChallengeSchema,
  verifyChallengeSchema,
} from '@gym/shared/validation/payment-challenges';

export const paymentChallengesRouter = Router();

paymentChallengesRouter.post(
  '/',
  withTenant(['client'], async (ctx, req) => {
    const input = parseBody(req, startChallengeSchema);
    return ok(await paymentChallengeService.start(ctx, input), 201);
  })
);

paymentChallengesRouter.post(
  '/:id/verify',
  withTenant(['client'], async (ctx, req, params) => {
    const { code } = parseBody(req, verifyChallengeSchema);
    return ok(await paymentChallengeService.verify(ctx, params.id, code));
  })
);
