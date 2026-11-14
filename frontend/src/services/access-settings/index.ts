import { apiClient } from '@/services/api';
import type { AccessSettings } from '@gym/shared/types';
import type { AccessSettingsValues } from '@gym/shared/validation/access-settings';

export const accessSettingsService = {
  get: () => apiClient.get<AccessSettings>('/access-settings'),
  update: (input: AccessSettingsValues) =>
    apiClient.put<AccessSettings>('/access-settings', input),
};
