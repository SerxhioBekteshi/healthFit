import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { createRateLimiter } from '@/http/rateLimit';

const servers: { close: () => void }[] = [];

const serve = async (
  limiter: ReturnType<typeof createRateLimiter>,
  status: (attempt: number) => number
): Promise<string> => {
  const app = express();
  let attempt = 0;
  app.post('/try', limiter, (_req, res) => {
    attempt += 1;
    res.status(status(attempt)).json({ ok: status(attempt) < 400 });
  });
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const started = app.listen(0, () => resolve(started));
  });
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/try`;
};

const post = (url: string) => fetch(url, { method: 'POST' });

afterEach(() => {
  servers.splice(0).forEach((server) => server.close());
});

describe('createRateLimiter', () => {
  it('answers 429 with a message once the limit is used up', async () => {
    const url = await serve(
      createRateLimiter({ windowMs: 60_000, limit: 2 }),
      () => 200
    );

    expect((await post(url)).status).toBe(200);
    expect((await post(url)).status).toBe(200);

    const blocked = await post(url);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({
      message: 'Too many attempts. Please try again later.',
      code: 'RATE_LIMITED',
    });
  });

  it('only counts failed requests when asked to skip successful ones', async () => {
    // Attempts 1-3 fail (wrong password), later ones would succeed.
    const url = await serve(
      createRateLimiter({ windowMs: 60_000, limit: 3, skipSuccessful: true }),
      (attempt) => (attempt <= 3 ? 401 : 200)
    );

    for (let index = 0; index < 3; index += 1) {
      expect((await post(url)).status).toBe(401);
    }
    expect((await post(url)).status).toBe(429);
  });

  it('does not count successes against the allowance', async () => {
    const url = await serve(
      createRateLimiter({ windowMs: 60_000, limit: 2, skipSuccessful: true }),
      () => 200
    );
    for (let index = 0; index < 6; index += 1) {
      expect((await post(url)).status).toBe(200);
    }
  });
});
