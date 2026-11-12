import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { auth } from '@/auth/auth';
import { env } from '@/config/env';
import { errorHandler, notFoundHandler } from '@/http/errorHandler';
import { v1Router } from '@/routes/v1';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      exposedHeaders: ['set-auth-token'],
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Gym photos are public marketing images under unguessable names; cross-origin so the SPA can embed them.
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(env.uploadsDir, {
      index: false,
      dotfiles: 'ignore',
      maxAge: '7d',
      immutable: true,
    })
  );

  // Better Auth parses its own body, so it must be mounted before express.json().
  app.all('/api/auth/*splat', toNodeHandler(auth));

  app.use(express.json());
  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
