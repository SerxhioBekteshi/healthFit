import { createCredentialUser } from '@/auth/credentials';
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

export const createClientAccount = async (
  ctx: TenantContext,
  input: CreateClientValues
) => {
  assertGymAdmin(ctx);
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await createCredentialUser(tx, {
        name: input.fullName,
        email: input.email,
        password: input.password,
        role: 'client',
        gymId: ctx.gymId,
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
