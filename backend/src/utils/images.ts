const IMAGE_TYPES = ['jpeg', 'png', 'webp'] as const;

export type ImageType = (typeof IMAGE_TYPES)[number];

const startsWith = (bytes: Buffer, signature: number[], offset = 0): boolean =>
  signature.every((value, index) => bytes[offset + index] === value);

// Trusts the file signature, never the client-declared content type or file name.
export const detectImageType = (bytes: Buffer): ImageType | null => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png';
  }
  // RIFF....WEBP
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'webp';
  }
  return null;
};

export const imageExtension = (type: ImageType): string =>
  type === 'jpeg' ? 'jpg' : type;
