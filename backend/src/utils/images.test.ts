import { describe, expect, it } from 'vitest';
import { detectImageType, imageExtension } from '@/utils/images';

describe('detectImageType', () => {
  it('recognises jpeg, png and webp by signature', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(
      detectImageType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
      )
    ).toBe('png');
    expect(
      detectImageType(
        Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', 'latin1')
      )
    ).toBe('webp');
  });

  it('rejects everything else, including scripts renamed to images', () => {
    expect(detectImageType(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
    expect(detectImageType(Buffer.from('GIF89a'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });

  it('maps types to file extensions', () => {
    expect(imageExtension('jpeg')).toBe('jpg');
    expect(imageExtension('png')).toBe('png');
  });
});
