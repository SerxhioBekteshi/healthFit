import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products';
import { invalidateMemberData, queryKeys } from '../query-keys';

export const useProducts = () =>
  useQuery({ queryKey: queryKeys.products, queryFn: productsService.list });

// Members pay from their balance; a purchase changes the stock and the ledger.
export const usePurchaseProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { success: 'Purchase completed.' },
    mutationFn: (productId: string) =>
      productsService.purchase(productId, { paymentMethod: 'balance' }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        invalidateMemberData(queryClient),
      ]);
    },
  });
};
