import { apiClient } from '@/api/client';
import type { PaymentSettings } from '@gym/shared/types';

export const paymentSettingsService = {
  get: () => apiClient.get<PaymentSettings>('/payment-settings'),
};
