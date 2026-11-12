import { apiClient } from '@/services/api';
import type {
  PaymentChallenge,
  PaymentChallengeResult,
} from '@gym/shared/types';
import type {
  StartChallengeValues,
  VerifyChallengeValues,
} from '@gym/shared/validation/payment-challenges';

export const paymentChallengesService = {
  start: (input: StartChallengeValues) =>
    apiClient.post<PaymentChallenge>('/payment-challenges', input),
  verify: (id: string, input: VerifyChallengeValues) =>
    apiClient.post<PaymentChallengeResult>(
      `/payment-challenges/${id}/verify`,
      input
    ),
};
