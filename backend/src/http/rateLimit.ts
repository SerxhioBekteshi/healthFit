import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '@/config/env';

interface LimiterOptions {
  windowMs: number;
  limit: number;
  // Requests that end well (status below 400) do not use up the allowance.
  skipSuccessful?: boolean;
}

export const createRateLimiter = ({
  windowMs,
  limit,
  skipSuccessful = false,
}: LimiterOptions): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccessful,
    handler: (_req, res) => {
      res.status(429).json({
        message: 'Too many attempts. Please try again later.',
        code: 'RATE_LIMITED',
      });
    },
  });

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// Wrong passwords count; a successful sign-in does not.
export const loginRateLimit = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: env.rateLimit.loginMax,
  skipSuccessful: true,
});

export const signupRateLimit = createRateLimiter({
  windowMs: ONE_HOUR,
  limit: env.rateLimit.signupMax,
});

export const inviteRateLimit = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  limit: env.rateLimit.inviteMax,
});
