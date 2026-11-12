import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';
import {
  requirePlatform,
  requireTenant,
  type PlatformContext,
  type TenantContext,
  type TenantRole,
} from '@/tenant/context';

export interface ApiResult {
  status: number;
  body: unknown;
}

type Params = Record<string, string>;

type TenantHandler = (
  ctx: TenantContext,
  req: Request,
  params: Params
) => Promise<ApiResult>;

type PlatformHandler = (
  ctx: PlatformContext,
  req: Request,
  params: Params
) => Promise<ApiResult>;

// Express 5 forwards rejected promises to the error middleware, so no try/catch here.
// Use requireRole before body parsers that buffer large uploads so anonymous callers cost nothing.
export const requireRole =
  (roles: readonly TenantRole[]): RequestHandler =>
  async (req, _res, next) => {
    await requireTenant(req, roles);
    next();
  };
export const withTenant =
  (roles: readonly TenantRole[], handler: TenantHandler): RequestHandler =>
  async (req, res) => {
    const ctx = await requireTenant(req, roles);
    const result = await handler(ctx, req, req.params as Params);
    res.status(result.status).json(result.body);
  };

export const withPlatform =
  (handler: PlatformHandler): RequestHandler =>
  async (req, res) => {
    const ctx = await requirePlatform(req);
    const result = await handler(ctx, req, req.params as Params);
    res.status(result.status).json(result.body);
  };

export const ok = <T>(data: T, status = 200): ApiResult => ({
  status,
  body: { data },
});

export const parseBody = <T>(req: Request, schema: ZodType<T>): T =>
  schema.parse(req.body);

// Validates the query string; a ZodError becomes a 422 like a bad body.
export const parseQuery = <T>(req: Request, schema: ZodType<T>): T =>
  schema.parse(req.query);
