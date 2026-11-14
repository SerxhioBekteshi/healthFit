import { apiClient } from '@/services/api';
import type { PaymentSettings } from '@gym/shared/types';
import type { PaymentSettingsValues } from '@gym/shared/validation/payment-settings';

export const paymentSettingsService = {
  get: () => apiClient.get<PaymentSettings>('/payment-settings'),
  update: (input: PaymentSettingsValues) =>
    apiClient.put<PaymentSettings>('/payment-settings', input),
};
