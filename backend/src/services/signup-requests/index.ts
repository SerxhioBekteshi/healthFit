import { hashPassword } from 'better-auth/crypto';
import type { SignupRequest as RequestRow } from '@prisma/client';
import { createCredentialUser } from '@/auth/credentials';
import { ConflictError, NotFoundError } from '@/errors';
import { gymService } from '@/services/gyms';
import type { PlatformContext, PublicContext } from '@/tenant/context';
import { retryOnConflict } from '@/utils/transactions';
import type { SignupRequest } from '@gym/shared/types';
import { COUNTRY_TIMEZONES } from '@gym/shared/validation/gyms';
import type { SignupRequestValues } from '@gym/shared/validation/signup-requests';

// The same text for a pending request and an existing account, so the form says nothing more.
const EMAIL_IN_USE = 'A request or account with this email already exists.';

const toDto = (row: RequestRow): SignupRequest => ({
  id: row.id,
  ownerName: row.ownerName,
  email: row.email,
  phone: row.phone,
  gymName: row.gymName,
  country: row.country,
  location: row.location,
  address: row.address,
  locationsCount: row.locationsCount,
  notes: row.notes,
  status: row.status,
  reviewNote: row.reviewNote,
  reviewedAt: row.reviewedAt?.toISOString() ?? null,
  gymId: row.gymId,
  createdAt: row.createdAt.toISOString(),
});

const requirePending = async (
  ctx: PlatformContext,
  id: string
): Promise<RequestRow> => {
  const row = await ctx.db.signupRequest.findUnique({ where: { id } });
  if (!row) {
    throw new NotFoundError('Signup request not found.');
  }
  if (row.status !== 'pending') {
    throw new ConflictError('This request was already reviewed.');
  }
  return row;
};

export const signupRequestService = {
  // Anonymous: stores the application with a hashed password; no account exists until approval.
  async submit(ctx: PublicContext, input: SignupRequestValues): Promise<void> {
    const email = input.email.toLowerCase();
    const passwordHash = await hashPassword(input.password);

    await retryOnConflict(() =>
      ctx.db.$transaction(
        async (tx) => {
          const account = await tx.user.findUnique({
            where: { email },
            select: { id: true },
          });
          const pending = await tx.signupRequest.findFirst({
            where: { email, status: 'pending' },
            select: { id: true },
          });
          if (account || pending) {
            throw new ConflictError(EMAIL_IN_USE);
          }
          await tx.signupRequest.create({
            data: {
              ownerName: input.ownerName,
              email,
              phone: input.phone,
              passwordHash,
              gymName: input.gymName,
              country: input.country,
              location: input.location,
              address: input.address,
              locationsCount: input.locationsCount,
              notes: input.notes,
            },
          });
        },
        { isolationLevel: 'Serializable' }
      )
    );
  },

  async list(ctx: PlatformContext): Promise<SignupRequest[]> {
    const rows = await ctx.db.signupRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  },

  // Creates the gym (with its default timetable and location) and the owner's admin account.
  async approve(ctx: PlatformContext, id: string): Promise<SignupRequest> {
    const request = await requirePending(ctx, id);

    const row = await ctx.db.$transaction(async (tx) => {
      const claimed = await tx.signupRequest.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'approved', reviewedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ConflictError('This request was already reviewed.');
      }
      const taken = await tx.user.findUnique({
        where: { email: request.email },
        select: { id: true },
      });
      if (taken) {
        throw new ConflictError('An account with this email already exists.');
      }

      const gym = await gymService.createWithin(tx, {
        name: request.gymName,
        location: request.location,
        country: request.country,
        businessHours: 'Mon-Sun 06:00-22:00',
        opensAt: '06:00',
        closesAt: '22:00',
        timezone: COUNTRY_TIMEZONES[request.country],
        logoUrl: '',
        address: request.address,
        contactEmail: request.email,
        contactPhone: request.phone,
        subdomain: '',
        customDomain: '',
      });
      await createCredentialUser(tx, {
        name: request.ownerName,
        email: request.email,
        passwordHash: request.passwordHash,
        role: 'gym_admin',
        gymId: gym.id,
      });
      return tx.signupRequest.update({
        where: { id },
        data: { gymId: gym.id },
      });
    });
    return toDto(row);
  },

  async reject(
    ctx: PlatformContext,
    id: string,
    note: string
  ): Promise<SignupRequest> {
    await requirePending(ctx, id);
    const claimed = await ctx.db.signupRequest.updateMany({
      where: { id, status: 'pending' },
      data: { status: 'rejected', reviewNote: note, reviewedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new ConflictError('This request was already reviewed.');
    }
    const row = await ctx.db.signupRequest.findUniqueOrThrow({ where: { id } });
    return toDto(row);
  },
};
