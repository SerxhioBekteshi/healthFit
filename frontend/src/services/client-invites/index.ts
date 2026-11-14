import { apiClient } from '@/services/api';
import type { ClientInvite, ClientInvitePreview } from '@gym/shared/types';

export const clientInvitesService = {
  // Gym admin: a fresh one-time link for a client (also a password reset).
  issue: (clientId: string) =>
    apiClient.post<ClientInvite>(`/clients/${clientId}/invite`),
  // Public: used by the page the client opens from the link.
  preview: (token: string) =>
    apiClient.get<ClientInvitePreview>(`/client-invites/${token}`),
  accept: (token: string, password: string) =>
    apiClient.post<{ accepted: true }>(`/client-invites/${token}/accept`, {
      password,
    }),
};
