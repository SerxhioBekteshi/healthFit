import { apiClient } from '@/services/api';
import type {
  ClientInvite,
  ClientInvitePreview,
  ClientInviteSent,
} from '@gym/shared/types';

export const clientInvitesService = {
  // Gym admin: a fresh one-time link for a client (also a password reset).
  issue: (clientId: string) =>
    apiClient.post<ClientInvite>(`/clients/${clientId}/invite`),
  // Gym admin: emails the link the dialog is showing to the client.
  sendByEmail: (clientId: string, token: string) =>
    apiClient.post<ClientInviteSent>(`/clients/${clientId}/invite/send`, {
      token,
    }),
  // Public: used by the page the client opens from the link.
  preview: (token: string) =>
    apiClient.get<ClientInvitePreview>(`/client-invites/${token}`),
  accept: (token: string, password: string) =>
    apiClient.post<{ accepted: true }>(`/client-invites/${token}/accept`, {
      password,
    }),
};
