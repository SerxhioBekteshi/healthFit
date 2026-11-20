import { Router } from 'express';
import { ok, parseBody, withPublic, withTenant } from '@/http/withTenant';
import { inviteRateLimit, memberSignupRateLimit } from '@/http/rateLimit';
import { clientSignupService } from '@/services/client-signups';
import {
  clientClaimSchema,
  clientSignupLookupSchema,
  clientSignupSchema,
} from '@gym/shared/validation/client-signups';

// Members signing up on their own. The public calls are rate limited; the join code is managed by the gym admin.
export const clientSignupsRouter = Router();

clientSignupsRouter.post(
  '/lookup',
  memberSignupRateLimit,
  withPublic(async (ctx, req) =>
    ok(
      await clientSignupService.lookup(
        ctx,
        parseBody(req, clientSignupLookupSchema)
      )
    )
  )
);

clientSignupsRouter.post(
  '/',
  memberSignupRateLimit,
  withPublic(async (ctx, req) =>
    ok(
      await clientSignupService.register(
        ctx,
        parseBody(req, clientSignupSchema)
      ),
      201
    )
  )
);

clientSignupsRouter.post(
  '/claim',
  memberSignupRateLimit,
  withPublic(async (ctx, req) =>
    ok(await clientSignupService.claim(ctx, parseBody(req, clientClaimSchema)))
  )
);

clientSignupsRouter.get(
  '/join/:code',
  inviteRateLimit,
  withPublic(async (ctx, _req, params) =>
    ok(await clientSignupService.joinPreview(ctx, params.code))
  )
);

clientSignupsRouter.get(
  '/join-code',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await clientSignupService.joinCode(ctx))
  )
);

clientSignupsRouter.post(
  '/join-code/rotate',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await clientSignupService.rotateJoinCode(ctx))
  )
);
