import { useMutation, useQuery } from '@tanstack/react-query';
import { applyGymCountryLanguage } from '@/hooks/session';
import { clientInvitesService } from '@/services/client-invites';

// Gym admin: creates the link; the dialog shows it, so no success toast.
export const useIssueClientInvite = () =>
  useMutation({
    meta: { silent: true },
    mutationFn: (clientId: string) => clientInvitesService.issue(clientId),
  });

// The invite page loads before anyone is signed in; the gym's country sets its language.
export const useClientInvitePreview = (token: string) =>
  useQuery({
    queryKey: ['client-invite', token],
    queryFn: async () => {
      const preview = await clientInvitesService.preview(token);
      applyGymCountryLanguage(preview.gymCountry);
      return preview;
    },
    retry: false,
    meta: { silent: true },
  });

export const useAcceptClientInvite = (token: string) =>
  useMutation({
    meta: { success: 'Password set. You can sign in now.' },
    mutationFn: (password: string) =>
      clientInvitesService.accept(token, password),
  });
