import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';
import { env } from '@/config/env';
import { prisma } from '@/db/client';

export const auth = betterAuth({
  baseURL: env.authUrl,
  trustedOrigins: env.corsOrigins,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Accounts are created by gym/platform admins, never by self sign-up.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'client',
        input: false,
      },
      gymId: { type: 'string', required: false, input: false },
    },
  },
  // Web uses the session cookie; mobile reads `set-auth-token` and sends `Authorization: Bearer`.
  plugins: [bearer()],
});
