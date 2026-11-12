import { hashPassword } from 'better-auth/crypto';
import type { Prisma, UserRole } from '@prisma/client';

interface CreateCredentialUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  gymId: string | null;
}

// Creates a user plus a Better Auth credential account (same hash format as Better Auth).
export const createCredentialUser = async (
  tx: Prisma.TransactionClient,
  input: CreateCredentialUserInput
) => {
  const user = await tx.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      emailVerified: true,
      role: input.role,
      gymId: input.gymId,
    },
  });

  await tx.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: await hashPassword(input.password),
    },
  });

  return user;
};
