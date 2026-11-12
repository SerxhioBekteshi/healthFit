import { apiClient } from '@/services/api';
import type { Client } from '@gym/shared/types';
import type {
  CreateClientValues,
  UpdateClientValues,
} from '@gym/shared/validation/clients';

export const clientsService = {
  list: () => apiClient.get<Client[]>('/clients'),
  create: (input: CreateClientValues) =>
    apiClient.post<Client>('/clients', input),
  update: (id: string, input: UpdateClientValues) =>
    apiClient.patch<Client>(`/clients/${id}`, input),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch<Client>(`/clients/${id}/status`, { isActive }),
};
