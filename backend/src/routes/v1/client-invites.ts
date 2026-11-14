import { Router } from 'express';
import { ok, parseBody, withPublic } from '@/http/withTenant';
import { inviteRateLimit } from '@/http/rateLimit';
import { clientInviteService } from '@/services/client-invites';
import { acceptClientInviteSchema } from '@gym/shared/validation/client-invites';

// Anonymous: the token in the link is the credential, so both calls are rate limited.
export const clientInvitesRouter = Router();

clientInvitesRouter.get(
  '/:token',
  inviteRateLimit,
  withPublic(async (ctx, _req, params) =>
    ok(await clientInviteService.preview(ctx, params.token))
  )
);

clientInvitesRouter.post(
  '/:token/accept',
  inviteRateLimit,
  withPublic(async (ctx, req, params) => {
    const { password } = parseBody(req, acceptClientInviteSchema);
    await clientInviteService.accept(ctx, params.token, password);
    return ok({ accepted: true });
  })
);
