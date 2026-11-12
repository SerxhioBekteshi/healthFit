import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { productService } from '@/services/products';
import { activeStatusSchema } from '@gym/shared/validation/common';
import {
  productFormSchema,
  purchaseProductSchema,
} from '@gym/shared/validation/products';

export const productsRouter = Router();

productsRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await productService.list(ctx))
  )
);

productsRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, productFormSchema);
    return ok(await productService.create(ctx, input), 201);
  })
);

productsRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, productFormSchema);
    return ok(await productService.update(ctx, params.id, input));
  })
);

productsRouter.patch(
  '/:id/status',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const { isActive } = parseBody(req, activeStatusSchema);
    return ok(await productService.setActive(ctx, params.id, isActive));
  })
);

productsRouter.post(
  '/:id/purchase',
  withTenant(['gym_admin', 'client'], async (ctx, req, params) => {
    const input = parseBody(req, purchaseProductSchema);
    return ok(await productService.sell(ctx, params.id, input), 201);
  })
);
