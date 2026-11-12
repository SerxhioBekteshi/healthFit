export type ProductCategory =
  'supplement' | 'snack' | 'drink' | 'merchandise' | 'shake' | 'smoothie';

export interface Product {
  id: string;
  gymId: string;
  name: string;
  category: ProductCategory;
  // Uploaded photo path, empty when the default icon of the category is used.
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
