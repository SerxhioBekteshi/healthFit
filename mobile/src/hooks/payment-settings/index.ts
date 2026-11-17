import { useQuery } from '@tanstack/react-query';
import { paymentSettingsService } from '@/services/payment-settings';
import type { PaymentSettings } from '@gym/shared/types';
import { queryKeys } from '../query-keys';

// Until the answer arrives every way of paying is open, which is the default of a gym; the server has the last word.
const allOpen: PaymentSettings = {
  acceptCard: true,
  acceptBalance: true,
  acceptCash: true,
};

export const usePaymentSettings = (): PaymentSettings =>
  useQuery({
    queryKey: queryKeys.paymentSettings,
    queryFn: paymentSettingsService.get,
  }).data ?? allOpen;
