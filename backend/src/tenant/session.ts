import type { UserRole } from '@prisma/client';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth } from '@/auth/auth';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  gymId: string | null;
}

const ROLES: readonly UserRole[] = ['super_admin', 'gym_admin', 'client'];

const parseRole = (value: unknown): UserRole | null =>
  ROLES.find((role) => role === value) ?? null;

export const getSessionUser = async (
  req: Request
): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    return null;
  }

  const user = session.user as Record<string, unknown>;
  const role = parseRole(user.role);
  if (!role) {
    return null;
  }

  return {
    id: String(user.id),
    email: String(user.email),
    name: String(user.name),
    role,
    gymId: typeof user.gymId === 'string' ? user.gymId : null,
  };
};
