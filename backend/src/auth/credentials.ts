import { hashPassword } from 'better-auth/crypto';
import type { Country, Gender, Prisma, UserRole } from '@prisma/client';

interface CreateCredentialUserInput {
  name: string;
  email: string;
  // Either the plain password, or a hash already made with Better Auth's hashPassword.
  password?: string;
  passwordHash?: string;
  role: UserRole;
  gymId: string | null;
  // Only set when a member signs up on their own.
  phone?: string;
  gender?: Gender;
  country?: Country;
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
      phone: input.phone,
      gender: input.gender,
      country: input.country,
    },
  });

  await tx.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password:
        input.passwordHash ?? (await hashPassword(input.password ?? '')),
    },
  });

  return user;
};
