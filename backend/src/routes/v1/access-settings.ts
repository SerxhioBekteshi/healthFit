import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { accessSettingsService } from '@/services/access-settings';
import { accessSettingsSchema } from '@gym/shared/validation/access-settings';

export const accessSettingsRouter = Router();

accessSettingsRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await accessSettingsService.get(ctx))
  )
);

accessSettingsRouter.put(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, accessSettingsSchema);
    return ok(await accessSettingsService.update(ctx, input));
  })
);
