import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { memberCardService } from '@/services/member-cards';
import { activeStatusSchema } from '@gym/shared/validation/common';
import { issueCardSchema } from '@gym/shared/validation/member-cards';

export const memberCardsRouter = Router();

memberCardsRouter.get(
  '/',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await memberCardService.list(ctx))
  )
);

memberCardsRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, issueCardSchema);
    return ok(await memberCardService.issue(ctx, input), 201);
  })
);

memberCardsRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await memberCardService.setActive(ctx, params.id, isActive));
  })
);
