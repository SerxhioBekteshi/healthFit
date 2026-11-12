import React from 'react';
import { assetUrl } from '@/services/api';
import {
  productCategoryEmoji,
  productCategoryLabels,
} from '@/utils/constants/product-categories';
import type { ProductCategory } from '@gym/shared/types';

interface ProductImageProps {
  category: ProductCategory;
  // Uploaded photo; the icon of the category shows when it is empty.
  imageUrl?: string;
  name?: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  category,
  imageUrl,
  name = '',
  className = 'h-12 w-12',
}) => (
  <span
    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06] text-2xl ${className}`}
  >
    {imageUrl ? (
      <img
        src={assetUrl(imageUrl)}
        alt={name || productCategoryLabels[category]}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    ) : (
      <span role="img" aria-label={productCategoryLabels[category]}>
        {productCategoryEmoji[category]}
      </span>
    )}
  </span>
);
