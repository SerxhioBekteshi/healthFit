import type { Country, PrismaClient, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '@/db/client';
import { ForbiddenError, UnauthorizedError } from '@/errors';
import { createTenantDb, type TenantDb } from '@/tenant/scopedDb';
import { getSessionUser, type SessionUser } from '@/tenant/session';

export type TenantRole = Exclude<UserRole, 'super_admin'>;

export interface TenantContext {
  user: SessionUser;
  role: TenantRole;
  gymId: string;
  // Set only for role `client`: the signed-in user's own client profile.
  clientId: string | null;
  db: TenantDb;
}

export interface PlatformContext {
  user: SessionUser;
  // Unscoped access. Only reachable by super_admin through requirePlatform().
  db: PrismaClient;
}

export const requireUser = async (req: Request): Promise<SessionUser> => {
  const user = await getSessionUser(req);
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
};

// Country of the user's own gym, for the default language and currency.
export const gymCountryOf = async (
  gymId: string | null
): Promise<Country | null> => {
  if (!gymId) {
    return null;
  }
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { country: true },
  });
  return gym?.country ?? null;
};

export const requireTenant = async (
  req: Request,
  allowedRoles: readonly TenantRole[]
): Promise<TenantContext> => {
  const user = await requireUser(req);

  if (user.role === 'super_admin' || !allowedRoles.includes(user.role)) {
    throw new ForbiddenError();
  }
  if (!user.gymId) {
    throw new ForbiddenError('Your account is not linked to a gym.');
  }

  const gym = await prisma.gym.findUnique({
    where: { id: user.gymId },
    select: { isActive: true },
  });
  if (!gym?.isActive) {
    throw new ForbiddenError('This gym is not active.');
  }

  let clientId: string | null = null;
  if (user.role === 'client') {
    const client = await prisma.client.findFirst({
      where: { userId: user.id, gymId: user.gymId, isActive: true },
      select: { id: true },
    });
    if (!client) {
      throw new ForbiddenError('No active client profile for this account.');
    }
    clientId = client.id;
  }

  return {
    user,
    role: user.role,
    gymId: user.gymId,
    clientId,
    db: createTenantDb(prisma, user.gymId),
  };
};

export const requirePlatform = async (
  req: Request
): Promise<PlatformContext> => {
  const user = await requireUser(req);
  if (user.role !== 'super_admin') {
    throw new ForbiddenError();
  }
  return { user, db: prisma };
};

// Super admin acting inside one gym, e.g. to inspect it. Explicit by design.
export const tenantDbForGym = (platform: PlatformContext, gymId: string) =>
  createTenantDb(platform.db, gymId);
