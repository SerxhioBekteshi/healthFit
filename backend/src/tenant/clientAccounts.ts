import { prisma } from '@/db/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  isUniqueViolation,
} from '@/errors';
import type { TenantContext } from '@/tenant/context';
import type {
  CreateClientValues,
  UpdateClientValues,
} from '@gym/shared/validation/clients';

// Explicit exception to "services use ctx.db": the login account (User/Account) is not
// reachable through the tenant-scoped db, so gymId is taken from ctx here and never from input.

const assertGymAdmin = (ctx: TenantContext): void => {
  if (ctx.role !== 'gym_admin') {
    throw new ForbiddenError();
  }
};

const rethrow = (error: unknown): never => {
  if (isUniqueViolation(error)) {
    throw new ConflictError('A client with this email already exists.');
  }
  throw error;
};

// Which of these users have a password and can sign in.
export const usersWithLogin = async (
  userIds: (string | null)[]
): Promise<Set<string>> => {
  const ids = userIds.filter((id): id is string => id !== null);
  if (ids.length === 0) {
    return new Set();
  }
  const accounts = await prisma.account.findMany({
    where: { userId: { in: ids }, providerId: 'credential' },
    select: { userId: true },
  });
  return new Set(accounts.map((account) => account.userId));
};

export const createClientAccount = async (
  ctx: TenantContext,
  input: CreateClientValues
) => {
  assertGymAdmin(ctx);
  const email = input.email.toLowerCase();
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      // Someone who signed up on their own (community, no gym yet) joins this gym and keeps their
      // password. Any other existing account is a conflict. A new client has no credential until
      // they use the invite link, so the gym never knows or sets a password.
      const user =
        existing && existing.role === 'client' && existing.gymId === null
          ? await tx.user.update({
              where: { id: existing.id },
              data: { gymId: ctx.gymId },
            })
          : await tx.user.create({
              data: {
                name: input.fullName,
                email,
                emailVerified: true,
                role: 'client',
                gymId: ctx.gymId,
              },
            });
      return tx.client.create({
        data: {
          gymId: ctx.gymId,
          userId: user.id,
          fullName: input.fullName,
          email: user.email,
          phone: input.phone,
          gender: input.gender,
        },
      });
    });
  } catch (error) {
    return rethrow(error);
  }
};

export const updateClientAccount = async (
  ctx: TenantContext,
  clientId: string,
  input: UpdateClientValues
) => {
  assertGymAdmin(ctx);
  const email = input.email.toLowerCase();
  try {
    return await prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({
        where: { id: clientId, gymId: ctx.gymId },
      });
      if (!client) {
        throw new NotFoundError('Client not found.');
      }
      if (client.userId) {
        await tx.user.update({
          where: { id: client.userId },
          data: { name: input.fullName, email },
        });
      }
      return tx.client.update({
        where: { id: clientId },
        data: {
          fullName: input.fullName,
          email,
          phone: input.phone,
          gender: input.gender,
        },
      });
    });
  } catch (error) {
    return rethrow(error);
  }
};
