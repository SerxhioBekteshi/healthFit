import { createHash, randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { NotFoundError, ValidationError } from '@/errors';
import type { PublicContext, TenantContext } from '@/tenant/context';
import type { ClientInvite, ClientInvitePreview } from '@gym/shared/types';

const INVITE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const INVALID = 'This invite link is invalid or has expired.';

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const clientInviteService = {
  // A fresh link replaces any earlier unused one, and also works as a password reset.
  async issue(
    ctx: TenantContext,
    clientId: string,
    now: Date = new Date()
  ): Promise<ClientInvite> {
    const client = await ctx.db.client.findFirst({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundError('Client not found.');
    }
    if (!client.userId) {
      throw new ValidationError('This client has no login account.');
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + INVITE_DAYS * DAY_MS);
    await ctx.db.$transaction(async (tx) => {
      await tx.clientInvite.deleteMany({ where: { clientId, usedAt: null } });
      await tx.clientInvite.create({
        data: {
          gymId: ctx.gymId,
          clientId,
          tokenHash: hashToken(token),
          expiresAt,
        },
      });
    });
    return { token, expiresAt: expiresAt.toISOString() };
  },

  // Anonymous: shows who the link is for. Unknown, used and expired links look the same.
  async preview(
    ctx: PublicContext,
    token: string,
    now: Date = new Date()
  ): Promise<ClientInvitePreview> {
    const invite = await ctx.db.clientInvite.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { client: true, gym: true },
    });
    if (
      !invite ||
      invite.usedAt ||
      invite.expiresAt <= now ||
      !invite.gym.isActive
    ) {
      throw new NotFoundError(INVALID);
    }
    return {
      clientName: invite.client.fullName,
      email: invite.client.email,
      gymName: invite.gym.name,
      gymCountry: invite.gym.country,
    };
  },

  // Anonymous: sets the password once, then the client signs in as usual.
  async accept(
    ctx: PublicContext,
    token: string,
    password: string,
    now: Date = new Date()
  ): Promise<void> {
    const passwordHash = await hashPassword(password);

    await ctx.db.$transaction(async (tx) => {
      const invite = await tx.clientInvite.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { client: true },
      });
      if (!invite || !invite.client.userId) {
        throw new NotFoundError(INVALID);
      }
      // Claiming the row first makes a second use of the same link fail.
      const claimed = await tx.clientInvite.updateMany({
        where: { id: invite.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count === 0) {
        throw new NotFoundError(INVALID);
      }

      const userId = invite.client.userId;
      const updated = await tx.account.updateMany({
        where: { userId, providerId: 'credential' },
        data: { password: passwordHash },
      });
      if (updated.count === 0) {
        await tx.account.create({
          data: {
            userId,
            accountId: userId,
            providerId: 'credential',
            password: passwordHash,
          },
        });
      }
      // A reset must end sessions that used the old password.
      await tx.session.deleteMany({ where: { userId } });
    });
  },
};
