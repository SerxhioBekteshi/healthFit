import type {
  Client as ClientRow,
  MemberCard as CardRow,
} from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueViolation,
} from '@/errors';
import { accessSettingsService } from '@/services/access-settings';
import type { TenantContext } from '@/tenant/context';
import type { MemberCard } from '@gym/shared/types';
import type { IssueCardValues } from '@gym/shared/validation/member-cards';

type CardWithClient = CardRow & { client: { fullName: string } };

const withClient = { client: { select: { fullName: true } } } as const;

// Readers differ in case, so numbers are always stored and matched in upper case.
export const normalizeCardNumber = (value: string): string =>
  value.trim().toUpperCase();

const toDto = (row: CardWithClient): MemberCard => ({
  id: row.id,
  clientId: row.clientId,
  clientName: row.client.fullName,
  number: row.number,
  isActive: row.isActive,
  issuedAt: row.issuedAt.toISOString(),
  deactivatedAt: row.deactivatedAt?.toISOString() ?? null,
});

export const memberCardService = {
  async list(ctx: TenantContext): Promise<MemberCard[]> {
    const rows = await ctx.db.memberCard.findMany({
      include: withClient,
      orderBy: [{ isActive: 'desc' }, { issuedAt: 'desc' }],
    });
    return rows.map(toDto);
  },

  // A member has one active card: issuing another retires the old one (lost, broken, replaced).
  async issue(
    ctx: TenantContext,
    input: IssueCardValues,
    now: Date = new Date()
  ): Promise<MemberCard> {
    await accessSettingsService.assertCardsEnabled(ctx);
    const client = await ctx.db.client.findFirst({
      where: { id: input.clientId, isActive: true },
    });
    if (!client) {
      throw new NotFoundError('Client not found or inactive.');
    }

    try {
      const row = await ctx.db.$transaction(async (tx) => {
        await tx.memberCard.updateMany({
          where: { clientId: client.id, isActive: true },
          data: { isActive: false, deactivatedAt: now },
        });
        return tx.memberCard.create({
          data: {
            gymId: ctx.gymId,
            clientId: client.id,
            number: normalizeCardNumber(input.number),
          },
          include: withClient,
        });
      });
      return toDto(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('That card number is already in use.');
      }
      throw error;
    }
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean,
    now: Date = new Date()
  ): Promise<MemberCard> {
    const card = await ctx.db.memberCard.findFirst({ where: { id } });
    if (!card) {
      throw new NotFoundError('Card not found.');
    }
    if (isActive) {
      const other = await ctx.db.memberCard.findFirst({
        where: { clientId: card.clientId, isActive: true, id: { not: id } },
      });
      if (other) {
        throw new ValidationError(
          'This member already has an active card. Block it first.'
        );
      }
    }
    await ctx.db.memberCard.updateMany({
      where: { id },
      data: { isActive, deactivatedAt: isActive ? null : now },
    });
    const row = await ctx.db.memberCard.findFirstOrThrow({
      where: { id },
      include: withClient,
    });
    return toDto(row);
  },

  async activeNumber(
    db: Pick<TenantContext['db'], 'memberCard'>,
    clientId: string
  ): Promise<string | null> {
    const card = await db.memberCard.findFirst({
      where: { clientId, isActive: true },
    });
    return card?.number ?? null;
  },

  // A scanned code is a card number, or else the member's own code (the QR in their app).
  async resolveClient(
    ctx: TenantContext,
    code: string
  ): Promise<{ client: ClientRow; viaCard: boolean }> {
    const settings = await accessSettingsService.get(ctx);
    if (settings.cardsEnabled) {
      const card = await ctx.db.memberCard.findFirst({
        where: { number: normalizeCardNumber(code) },
        include: { client: true },
      });
      if (card) {
        if (!card.isActive) {
          throw new ValidationError('This card is no longer active.');
        }
        return { client: card.client, viaCard: true };
      }
    }
    const client = await ctx.db.client.findFirst({
      where: { id: code.trim() },
    });
    if (!client) {
      throw new NotFoundError('No client found for that code in this gym.');
    }
    return { client, viaCard: false };
  },
};
