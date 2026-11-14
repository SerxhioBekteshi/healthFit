import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentSettingsService } from '@/services/payment-settings';
import type { PaymentSettings } from '@gym/shared/types';
import type { PaymentSettingsValues } from '@gym/shared/validation/payment-settings';

const settingsQueryKey = ['payment-settings'] as const;

// Until the answer arrives every way of paying looks on, which is the default for a gym.
const allOn: PaymentSettings = {
  acceptCard: true,
  acceptBalance: true,
  acceptCash: true,
};

export const usePaymentSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: settingsQueryKey,
    queryFn: paymentSettingsService.get,
  });

  const updateSettings = useMutation({
    meta: { success: 'Payment settings saved.' },
    mutationFn: (input: PaymentSettingsValues) =>
      paymentSettingsService.update(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsQueryKey, saved);
    },
  });

  return {
    settings: settingsQuery.data ?? allOn,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings,
  };
};
