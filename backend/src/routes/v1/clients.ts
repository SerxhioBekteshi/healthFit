import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { clientService } from '@/services/clients';
import { clientInviteService } from '@/services/client-invites';
import {
  clientStatusSchema,
  createClientSchema,
  updateClientSchema,
} from '@gym/shared/validation/clients';

export const clientsRouter = Router();

clientsRouter.get(
  '/',
  withTenant(['gym_admin'], async (ctx) => ok(await clientService.list(ctx)))
);

clientsRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, createClientSchema);
    return ok(await clientService.create(ctx, input), 201);
  })
);

clientsRouter.get(
  '/:id',
  withTenant(['gym_admin'], async (ctx, _req, params) =>
    ok(await clientService.get(ctx, params.id))
  )
);

clientsRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, updateClientSchema);
    return ok(await clientService.update(ctx, params.id, input));
  })
);

clientsRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, clientStatusSchema);
    return ok(await clientService.setActive(ctx, params.id, isActive));
  })
);

// Returns the one-time link token once; give it to the client (also works as a password reset).
clientsRouter.post(
  '/:id/invite',
  withTenant(['gym_admin'], async (ctx, _req, params) =>
    ok(await clientInviteService.issue(ctx, params.id), 201)
  )
);
