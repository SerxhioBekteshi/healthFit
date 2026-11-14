import { Router } from 'express';
import { ok, parseBody, withPlatform, withPublic } from '@/http/withTenant';
import { signupRateLimit } from '@/http/rateLimit';
import { signupRequestService } from '@/services/signup-requests';
import {
  rejectSignupRequestSchema,
  signupRequestSchema,
} from '@gym/shared/validation/signup-requests';

export const signupRequestsRouter = Router();

// Open to visitors, so it is rate limited. A filled hidden field means a bot: answer as if it worked.
signupRequestsRouter.post(
  '/',
  signupRateLimit,
  withPublic(async (ctx, req) => {
    const input = parseBody(req, signupRequestSchema);
    if (!input.company) {
      await signupRequestService.submit(ctx, input);
    }
    return ok({ received: true }, 201);
  })
);

signupRequestsRouter.get(
  '/',
  withPlatform(async (ctx) => ok(await signupRequestService.list(ctx)))
);

signupRequestsRouter.post(
  '/:id/approve',
  withPlatform(async (ctx, _req, params) =>
    ok(await signupRequestService.approve(ctx, params.id))
  )
);

signupRequestsRouter.post(
  '/:id/reject',
  withPlatform(async (ctx, req, params) => {
    const { note } = parseBody(req, rejectSignupRequestSchema);
    return ok(await signupRequestService.reject(ctx, params.id, note));
  })
);
