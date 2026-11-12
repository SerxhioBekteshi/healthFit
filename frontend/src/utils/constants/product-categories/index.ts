import { msg, translated } from '@/i18n';
import type { ProductCategory } from '@gym/shared/types';

export const productCategoryLabels = translated<ProductCategory>({
  supplement: msg('Supplement'),
  snack: msg('Snack'),
  drink: msg('Drink'),
  merchandise: msg('Merchandise'),
  shake: msg('Protein shake'),
  smoothie: msg('Smoothie'),
});

// Default picture of a product until the gym uploads a photo.
export const productCategoryEmoji: Record<ProductCategory, string> = {
  supplement: '\u{1F4AA}',
  snack: '\u{1F36B}',
  drink: '\u{1F964}',
  merchandise: '\u{1F455}',
  shake: '\u{1F95B}',
  smoothie: '\u{1F379}',
};

// Translate it where it is shown: `t(PREPARED_WARNING)`.
export const PREPARED_WARNING = msg(
  'Made on the spot and payable only by cash at the gym.'
);
