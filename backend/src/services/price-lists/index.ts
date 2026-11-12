import { rm } from 'node:fs/promises';
import path from 'node:path';
import type { GymPhoto as PhotoRow } from '@prisma/client';
import { env } from '@/config/env';
import { NotFoundError, ValidationError } from '@/errors';
import { uploadService } from '@/services/uploads';
import type { TenantContext } from '@/tenant/context';
import type { PriceList, PriceListPhoto } from '@gym/shared/types';
import {
  MAX_PRICE_LIST_PHOTOS,
  type PriceListNotesValues,
} from '@gym/shared/validation/price-lists';

export { MAX_UPLOAD_BYTES } from '@/services/uploads';

const toPhotoDto = (row: PhotoRow): PriceListPhoto => ({
  id: row.id,
  url: `/uploads/${row.gymId}/${row.filename}`,
  createdAt: row.createdAt.toISOString(),
});

const photoPath = (row: PhotoRow): string =>
  path.join(env.uploadsDir, row.gymId, row.filename);

export const priceListService = {
  async get(ctx: TenantContext): Promise<PriceList> {
    const [notes, photos] = await Promise.all([
      ctx.db.priceListNote.findMany({ orderBy: { position: 'asc' } }),
      ctx.db.gymPhoto.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);
    return {
      notes: notes.map((note) => note.text),
      photos: photos.map(toPhotoDto),
    };
  },

  async setNotes(
    ctx: TenantContext,
    input: PriceListNotesValues
  ): Promise<PriceList> {
    await ctx.db.$transaction(async (tx) => {
      await tx.priceListNote.deleteMany({});
      await tx.priceListNote.createMany({
        data: input.notes.map((text, position) => ({
          gymId: ctx.gymId,
          text,
          position,
        })),
      });
    });
    return priceListService.get(ctx);
  },

  async addPhoto(ctx: TenantContext, bytes: unknown): Promise<PriceListPhoto> {
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
      throw new ValidationError('Choose an image to upload.');
    }
    if ((await ctx.db.gymPhoto.count()) >= MAX_PRICE_LIST_PHOTOS) {
      throw new ValidationError(
        `A gym can have at most ${MAX_PRICE_LIST_PHOTOS} photos.`
      );
    }

    const stored = await uploadService.storeImage(ctx, bytes);
    try {
      const row = await ctx.db.gymPhoto.create({
        data: { gymId: ctx.gymId, filename: stored.filename },
      });
      return toPhotoDto(row);
    } catch (error) {
      await stored.remove();
      throw error;
    }
  },

  async removePhoto(ctx: TenantContext, id: string): Promise<void> {
    const row = await ctx.db.gymPhoto.findFirst({ where: { id } });
    if (!row) {
      throw new NotFoundError('Photo not found.');
    }
    await ctx.db.gymPhoto.deleteMany({ where: { id } });
    await rm(photoPath(row), { force: true });
  },
};
