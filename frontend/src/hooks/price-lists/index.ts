import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { priceListsService } from '@/services/price-lists';
import type { PriceListNotesValues } from '@gym/shared/validation/price-lists';

const priceListQueryKey = ['price-list'] as const;

export const usePriceList = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: priceListQueryKey });

  const priceListQuery = useQuery({
    queryKey: priceListQueryKey,
    queryFn: priceListsService.get,
  });

  const saveNotes = useMutation({
    meta: { success: 'Notes saved.' },
    mutationFn: (input: PriceListNotesValues) =>
      priceListsService.saveNotes(input),
    onSuccess: (data) => queryClient.setQueryData(priceListQueryKey, data),
  });

  const uploadPhoto = useMutation({
    meta: { success: 'Photo uploaded.' },
    mutationFn: (file: File) => priceListsService.uploadPhoto(file),
    onSuccess: invalidate,
  });

  const deletePhoto = useMutation({
    meta: { success: 'Photo deleted.' },
    mutationFn: (id: string) => priceListsService.deletePhoto(id),
    onSuccess: invalidate,
  });

  return {
    notes: priceListQuery.data?.notes ?? [],
    photos: priceListQuery.data?.photos ?? [],
    isLoading: priceListQuery.isLoading,
    error: priceListQuery.error,
    saveNotes,
    uploadPhoto,
    deletePhoto,
  };
};
