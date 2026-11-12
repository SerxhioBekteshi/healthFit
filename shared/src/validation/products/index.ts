import { z } from 'zod';
import type { ProductCategory } from '../../types/products';
import { uploadedImageUrlSchema } from '../common';

export const productCategories = [
  'supplement',
  'snack',
  'drink',
  'merchandise',
  'shake',
  'smoothie',
] as const satisfies readonly ProductCategory[];

export const productCategorySchema = z.enum(productCategories, {
  error: 'Select a valid category.',
});

// Made on the spot: no stock, paid in cash at the counter.
export const isPreparedCategory = (category: ProductCategory): boolean =>
  category === 'shake' || category === 'smoothie';

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.'),
  category: productCategorySchema.optional(),
  imageUrl: uploadedImageUrlSchema.optional(),
  price: z
    .number({ error: 'Price must be a number.' })
    .min(0, 'Price cannot be negative.')
    .max(10000, 'Price is too high.'),
  stock: z
    .number({ error: 'Stock must be a number.' })
    .int('Stock must be a whole number.')
    .min(0, 'Stock cannot be negative.'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

// Bank transfers are not accepted because products are handed over immediately.
export const purchaseProductSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'online', 'balance'], {
    error: 'Select a valid payment method.',
  }),
  clientId: z.string().min(1).optional(),
});

export type PurchaseProductValues = z.infer<typeof purchaseProductSchema>;
