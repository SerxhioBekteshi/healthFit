import express, { Router } from 'express';
import { ok, requireRole, withTenant } from '@/http/withTenant';
import { MAX_UPLOAD_BYTES, uploadService } from '@/services/uploads';

export const uploadsRouter = Router();

// Raw image bytes (Content-Type image/jpeg|png|webp); auth runs before the body is buffered.
uploadsRouter.post(
  '/',
  requireRole(['gym_admin']),
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp'],
    limit: MAX_UPLOAD_BYTES,
  }),
  withTenant(['gym_admin'], async (ctx, req) => {
    const { url } = await uploadService.storeImage(ctx, req.body);
    return ok({ url }, 201);
  })
);
