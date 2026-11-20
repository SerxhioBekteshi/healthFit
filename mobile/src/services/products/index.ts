import { apiClient } from '@/api/client';
import type { Product } from '@gym/shared/types';
import type { PurchaseProductValues } from '@gym/shared/validation/products';

export const productsService = {
  // A client only gets the active products of their gym.
  list: () => apiClient.get<Product[]>('/products'),
  purchase: (id: string, input: PurchaseProductValues) =>
    apiClient.post<Product>(`/products/${id}/purchase`, input),
};
