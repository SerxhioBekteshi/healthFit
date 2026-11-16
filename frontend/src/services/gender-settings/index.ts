import { apiClient } from '@/services/api';
import type { GenderSettings } from '@gym/shared/types';
import type { GenderSettingsValues } from '@gym/shared/validation/gender-settings';

export const genderSettingsService = {
  get: () => apiClient.get<GenderSettings>('/gender-settings'),
  update: (input: GenderSettingsValues) =>
    apiClient.put<GenderSettings>('/gender-settings', input),
};
