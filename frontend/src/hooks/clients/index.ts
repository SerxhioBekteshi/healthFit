import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/clients';
import type {
  CreateClientValues,
  UpdateClientValues,
} from '@gym/shared/validation/clients';

const clientsQueryKey = ['clients'] as const;

export const useClients = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: clientsQueryKey });

  const clientsQuery = useQuery({
    queryKey: clientsQueryKey,
    queryFn: clientsService.list,
  });

  const createClient = useMutation({
    meta: { success: 'Client created.' },
    mutationFn: (input: CreateClientValues) => clientsService.create(input),
    onSuccess: invalidate,
  });

  const updateClient = useMutation({
    meta: { success: 'Client updated.' },
    mutationFn: ({
      clientId,
      input,
    }: {
      clientId: string;
      input: UpdateClientValues;
    }) => clientsService.update(clientId, input),
    onSuccess: invalidate,
  });

  const setClientActive = useMutation({
    meta: { success: 'Client status updated.' },
    mutationFn: ({
      clientId,
      isActive,
    }: {
      clientId: string;
      isActive: boolean;
    }) => clientsService.setActive(clientId, isActive),
    onSuccess: invalidate,
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient,
    updateClient,
    setClientActive,
  };
};
