import path from 'node:path';

const port = Number(process.env.PORT ?? 4000);

// Number of reverse proxies in front of the API (0 means none); needed to see the real client IP.
const trustProxy = Number(process.env.TRUST_PROXY ?? 0);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  trustProxy:
    Number.isInteger(trustProxy) && trustProxy > 0 ? trustProxy : false,
  rateLimit: {
    // Wrong sign-in attempts per IP in 15 minutes.
    loginMax: Number(process.env.RATE_LIMIT_LOGIN_MAX ?? 10),
    // Sign-up requests per IP in an hour.
    signupMax: Number(process.env.RATE_LIMIT_SIGNUP_MAX ?? 5),
    // Invite link lookups and uses per IP in 15 minutes (stops guessing tokens).
    inviteMax: Number(process.env.RATE_LIMIT_INVITE_MAX ?? 30),
    // Member sign-up steps (email lookup, register, claim) per IP in 15 minutes.
    memberSignupMax: Number(process.env.RATE_LIMIT_MEMBER_SIGNUP_MAX ?? 20),
  },
  // Uploaded gym photos; relative paths resolve from the backend working directory.
  uploadsDir: path.resolve(process.env.UPLOADS_DIR ?? 'uploads'),
  // Outgoing email (sign-up verification codes). Without SMTP_HOST nothing is sent: development only
  // logs it, and production refuses to send.
  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'HealthFIT <no-reply@healthfit.app>',
  },
  // Origins allowed to call the API with credentials (web SPA); mobile does not need CORS.
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Where the web app lives; the links in emails (client invites) start with it.
  webOrigin: (
    process.env.WEB_ORIGIN ??
    process.env.CORS_ORIGINS?.split(',')[0]?.trim() ??
    'http://localhost:5173'
  ).replace(/\/+$/, ''),
  authUrl: process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`,
};
