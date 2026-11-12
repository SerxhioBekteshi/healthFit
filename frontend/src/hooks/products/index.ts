import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products';
import type {
  ProductFormValues,
  PurchaseProductValues,
} from '@gym/shared/validation/products';

const productsQueryKey = ['products'] as const;

export const useProducts = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: productsQueryKey });

  const productsQuery = useQuery({
    queryKey: productsQueryKey,
    queryFn: productsService.list,
  });

  const createProduct = useMutation({
    meta: { success: 'Product created.' },
    mutationFn: (input: ProductFormValues) => productsService.create(input),
    onSuccess: invalidate,
  });

  const updateProduct = useMutation({
    meta: { success: 'Product updated.' },
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: ProductFormValues;
    }) => productsService.update(productId, input),
    onSuccess: invalidate,
  });

  const setProductActive = useMutation({
    meta: { success: 'Product visibility updated.' },
    mutationFn: ({
      productId,
      isActive,
    }: {
      productId: string;
      isActive: boolean;
    }) => productsService.setActive(productId, isActive),
    onSuccess: invalidate,
  });

  const purchaseProduct = useMutation({
    meta: { success: 'Purchase completed.' },
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: PurchaseProductValues;
    }) => productsService.purchase(productId, input),
    // A purchase changes stock and the buyer's ledger.
    onSuccess: async () => {
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
      ]);
    },
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct,
    updateProduct,
    setProductActive,
    purchaseProduct,
  };
};
