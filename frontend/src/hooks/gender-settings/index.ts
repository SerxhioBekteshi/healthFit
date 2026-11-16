import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { genderSettingsService } from '@/services/gender-settings';
import type { GenderSettings } from '@gym/shared/types';
import type { GenderSettingsValues } from '@gym/shared/validation/gender-settings';

const settingsQueryKey = ['gender-settings'] as const;

// Until the answer arrives, men and women are configured separately (the default for a gym).
const separateByDefault: GenderSettings = {
  samePricesForGenders: false,
  sameLockersForGenders: false,
};

export const useGenderSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: settingsQueryKey,
    queryFn: genderSettingsService.get,
  });

  const updateSettings = useMutation({
    meta: { success: 'Settings saved.' },
    mutationFn: (input: GenderSettingsValues) =>
      genderSettingsService.update(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsQueryKey, saved);
    },
  });

  return {
    settings: settingsQuery.data ?? separateByDefault,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings,
  };
};
