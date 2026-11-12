import path from 'node:path';

const port = Number(process.env.PORT ?? 4000);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  // Uploaded gym photos; relative paths resolve from the backend working directory.
  uploadsDir: path.resolve(process.env.UPLOADS_DIR ?? 'uploads'),
  // Origins allowed to call the API with credentials (web SPA); mobile does not need CORS.
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  authUrl: process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`,
};
