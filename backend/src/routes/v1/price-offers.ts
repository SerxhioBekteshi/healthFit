import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { priceOfferService } from '@/services/price-offers';
import { activeStatusSchema } from '@gym/shared/validation/common';
import { priceOfferFormSchema } from '@gym/shared/validation/price-offers';

export const priceOffersRouter = Router();

priceOffersRouter.get(
  '/',
  withTenant(['gym_admin'], async (ctx) =>
    ok(await priceOfferService.list(ctx))
  )
);

priceOffersRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, priceOfferFormSchema);
    return ok(await priceOfferService.create(ctx, input), 201);
  })
);

priceOffersRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, priceOfferFormSchema);
    return ok(await priceOfferService.update(ctx, params.id, input));
  })
);

priceOffersRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await priceOfferService.setActive(ctx, params.id, isActive));
  })
);

priceOffersRouter.delete(
  '/:id',
  withTenant(['gym_admin'], async (ctx, _req, params) => {
    await priceOfferService.remove(ctx, params.id);
    return ok({ id: params.id });
  })
);
