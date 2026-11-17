import { apiClient } from '@/api/client';
import type { AccessSettings } from '@gym/shared/types';

export const accessSettingsService = {
  get: () => apiClient.get<AccessSettings>('/access-settings'),
};
