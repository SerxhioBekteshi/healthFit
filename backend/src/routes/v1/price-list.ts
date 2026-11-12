import express, { Router } from 'express';
import { ok, parseBody, requireRole, withTenant } from '@/http/withTenant';
import { MAX_UPLOAD_BYTES, priceListService } from '@/services/price-lists';
import { priceListNotesSchema } from '@gym/shared/validation/price-lists';

export const priceListRouter = Router();

priceListRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await priceListService.get(ctx))
  )
);

priceListRouter.put(
  '/notes',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, priceListNotesSchema);
    return ok(await priceListService.setNotes(ctx, input));
  })
);

// Raw image bytes (Content-Type image/jpeg|png|webp); auth runs before the body is buffered.
priceListRouter.post(
  '/photos',
  requireRole(['gym_admin']),
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp'],
    limit: MAX_UPLOAD_BYTES,
  }),
  withTenant(['gym_admin'], async (ctx, req) =>
    ok(await priceListService.addPhoto(ctx, req.body), 201)
  )
);

priceListRouter.delete(
  '/photos/:id',
  withTenant(['gym_admin'], async (ctx, _req, params) => {
    await priceListService.removePhoto(ctx, params.id);
    return ok({ id: params.id });
  })
);
