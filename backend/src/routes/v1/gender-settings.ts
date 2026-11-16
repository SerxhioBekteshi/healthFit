import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { genderSettingsService } from '@/services/gender-settings';
import { genderSettingsSchema } from '@gym/shared/validation/gender-settings';

export const genderSettingsRouter = Router();

genderSettingsRouter.get(
  '/',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await genderSettingsService.get(ctx))
  )
);

genderSettingsRouter.put(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, genderSettingsSchema);
    return ok(await genderSettingsService.update(ctx, input));
  })
);
