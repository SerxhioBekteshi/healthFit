import { apiClient } from '@/services/api';
import type { PriceOffer } from '@gym/shared/types';
import type { PriceOfferFormValues } from '@gym/shared/validation/price-offers';

export const priceOffersService = {
  list: () => apiClient.get<PriceOffer[]>('/price-offers'),
  create: (input: PriceOfferFormValues) =>
    apiClient.post<PriceOffer>('/price-offers', input),
  update: (id: string, input: PriceOfferFormValues) =>
    apiClient.patch<PriceOffer>(`/price-offers/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<PriceOffer>(`/price-offers/${id}/status`, { isActive }),
  remove: (id: string) =>
    apiClient.delete<{ id: string }>(`/price-offers/${id}`),
};
