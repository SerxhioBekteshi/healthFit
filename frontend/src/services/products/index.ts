import { apiClient } from '@/services/api';
import type { Product } from '@gym/shared/types';
import type {
  ProductFormValues,
  PurchaseProductValues,
} from '@gym/shared/validation/products';

export const productsService = {
  list: () => apiClient.get<Product[]>('/products'),
  create: (input: ProductFormValues) =>
    apiClient.post<Product>('/products', input),
  update: (id: string, input: ProductFormValues) =>
    apiClient.patch<Product>(`/products/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<Product>(`/products/${id}/status`, { isActive }),
  purchase: (id: string, input: PurchaseProductValues) =>
    apiClient.post<Product>(`/products/${id}/purchase`, input),
};
