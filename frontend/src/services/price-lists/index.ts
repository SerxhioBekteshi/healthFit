import { apiClient } from '@/services/api';
import type { PriceList, PriceListPhoto } from '@gym/shared/types';
import type { PriceListNotesValues } from '@gym/shared/validation/price-lists';

export const priceListsService = {
  get: () => apiClient.get<PriceList>('/price-list'),
  saveNotes: (input: PriceListNotesValues) =>
    apiClient.put<PriceList>('/price-list/notes', input),
  uploadPhoto: (file: File) =>
    apiClient.upload<PriceListPhoto>('/price-list/photos', file),
  deletePhoto: (id: string) =>
    apiClient.delete<{ id: string }>(`/price-list/photos/${id}`),
};
