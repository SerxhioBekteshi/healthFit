import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/config/env';
import { ValidationError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import { detectImageType, imageExtension } from '@/utils/images';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface StoredImage {
  // Public path such as `/uploads/<gymId>/<file>.jpg`.
  url: string;
  filename: string;
  remove: () => Promise<void>;
}

export const uploadService = {
  // The file name is generated here; client-supplied names and content types are never used.
  async storeImage(ctx: TenantContext, bytes: unknown): Promise<StoredImage> {
    if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
      throw new ValidationError('Choose an image to upload.');
    }
    const type = detectImageType(bytes);
    if (!type) {
      throw new ValidationError('Only JPEG, PNG or WebP images are allowed.');
    }

    const filename = `${randomUUID()}.${imageExtension(type)}`;
    const directory = path.join(env.uploadsDir, ctx.gymId);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), bytes);

    return {
      url: `/uploads/${ctx.gymId}/${filename}`,
      filename,
      remove: () => rm(path.join(directory, filename), { force: true }),
    };
  },

  // An empty value means no image; anything else must be a file of the caller's own gym.
  requireOwnImage(ctx: TenantContext, url: string | undefined): string {
    if (!url) {
      return '';
    }
    if (!url.startsWith(`/uploads/${ctx.gymId}/`)) {
      throw new ValidationError('Invalid image.');
    }
    return url;
  },
};
