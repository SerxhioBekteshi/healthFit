import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { staffMemberService } from '@/services/staff-members';
import { activeStatusSchema } from '@gym/shared/validation/common';
import { staffMemberFormSchema } from '@gym/shared/validation/staff-members';

export const staffMembersRouter = Router();

staffMembersRouter.get(
  '/',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await staffMemberService.list(ctx))
  )
);

staffMembersRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, staffMemberFormSchema);
    return ok(await staffMemberService.create(ctx, input), 201);
  })
);

staffMembersRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, staffMemberFormSchema);
    return ok(await staffMemberService.update(ctx, params.id, input));
  })
);

staffMembersRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await staffMemberService.setActive(ctx, params.id, isActive));
  })
);
