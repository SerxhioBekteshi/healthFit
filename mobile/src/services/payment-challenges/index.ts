import { apiClient } from '@/api/client';
import type {
  PaymentChallenge,
  PaymentChallengeResult,
} from '@gym/shared/types';
import type {
  StartChallengeValues,
  VerifyChallengeValues,
} from '@gym/shared/validation/payment-challenges';

export const paymentChallengesService = {
  start: (values: StartChallengeValues) =>
    apiClient.post<PaymentChallenge>('/payment-challenges', values),
  verify: (challengeId: string, values: VerifyChallengeValues) =>
    apiClient.post<PaymentChallengeResult>(
      `/payment-challenges/${challengeId}/verify`,
      values
    ),
};
