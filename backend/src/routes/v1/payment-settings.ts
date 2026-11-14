import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { paymentSettingsService } from '@/services/payment-settings';
import { paymentSettingsSchema } from '@gym/shared/validation/payment-settings';

export const paymentSettingsRouter = Router();

paymentSettingsRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await paymentSettingsService.get(ctx))
  )
);

paymentSettingsRouter.put(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, paymentSettingsSchema);
    return ok(await paymentSettingsService.update(ctx, input));
  })
);
