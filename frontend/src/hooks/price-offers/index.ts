import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { priceOffersService } from '@/services/price-offers';
import type { PriceOfferFormValues } from '@gym/shared/validation/price-offers';

const offersQueryKey = ['price-offers'] as const;

export const usePriceOffers = () => {
  const queryClient = useQueryClient();
  // Plans carry the offer in force, so they refresh with the offers.
  const invalidate = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: offersQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] }),
    ]);
  };

  const offersQuery = useQuery({
    queryKey: offersQueryKey,
    queryFn: priceOffersService.list,
  });

  const createOffer = useMutation({
    meta: { success: 'Offer created.' },
    mutationFn: (input: PriceOfferFormValues) =>
      priceOffersService.create(input),
    onSuccess: invalidate,
  });

  const updateOffer = useMutation({
    meta: { success: 'Offer updated.' },
    mutationFn: ({
      offerId,
      input,
    }: {
      offerId: string;
      input: PriceOfferFormValues;
    }) => priceOffersService.update(offerId, input),
    onSuccess: invalidate,
  });

  const setOfferActive = useMutation({
    meta: { success: 'Offer updated.' },
    mutationFn: ({
      offerId,
      isActive,
    }: {
      offerId: string;
      isActive: boolean;
    }) => priceOffersService.setActive(offerId, isActive),
    onSuccess: invalidate,
  });

  const deleteOffer = useMutation({
    meta: { success: 'Offer deleted.' },
    mutationFn: (offerId: string) => priceOffersService.remove(offerId),
    onSuccess: invalidate,
  });

  return {
    offers: offersQuery.data ?? [],
    isLoading: offersQuery.isLoading,
    error: offersQuery.error,
    createOffer,
    updateOffer,
    setOfferActive,
    deleteOffer,
  };
};
