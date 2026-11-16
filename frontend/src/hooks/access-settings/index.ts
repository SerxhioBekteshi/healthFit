import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accessSettingsService } from '@/services/access-settings';
import type { AccessSettings } from '@gym/shared/types';
import type { AccessSettingsValues } from '@gym/shared/validation/access-settings';

const settingsQueryKey = ['access-settings'] as const;

// Until the answer arrives nothing is offered, which is the default for a gym.
const allOff: AccessSettings = {
  cardsEnabled: false,
  lockersUseCard: false,
};

export const useAccessSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: settingsQueryKey,
    queryFn: accessSettingsService.get,
  });

  const updateSettings = useMutation({
    meta: { success: 'Access settings saved.' },
    mutationFn: (input: AccessSettingsValues) =>
      accessSettingsService.update(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsQueryKey, saved);
    },
  });

  return {
    settings: settingsQuery.data ?? allOff,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings,
  };
};
