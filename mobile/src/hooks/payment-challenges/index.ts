import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { msg, t } from '@/i18n';
import { paymentChallengesService } from '@/services/payment-challenges';
import { subscriptionMessage } from '@/utils/memberships';
import type {
  PaymentChallenge,
  PaymentChallengeResult,
} from '@gym/shared/types';
import type { StartChallengeValues } from '@gym/shared/validation/payment-challenges';
import { invalidateMemberData } from '../query-keys';

// A card payment has two steps: start (the server sends a code), then verify (the server charges).
export const usePaymentChallenge = () => {
  const queryClient = useQueryClient();
  const [challenge, setChallenge] = useState<PaymentChallenge | null>(null);
  const lastRequest = useRef<StartChallengeValues | null>(null);

  const start = useMutation({
    meta: { success: msg('Verification code sent.') },
    mutationFn: (values: StartChallengeValues) => {
      lastRequest.current = values;
      return paymentChallengesService.start(values);
    },
    onSuccess: setChallenge,
  });

  const verify = useMutation({
    meta: {
      success: (data) => {
        const result = data as PaymentChallengeResult;
        return result.kind === 'membership'
          ? subscriptionMessage(result.membership)
          : t('Payment verified. Your balance is updated.');
      },
    },
    mutationFn: (code: string): Promise<PaymentChallengeResult> => {
      if (!challenge) throw new Error(t('Start the payment again.'));
      return paymentChallengesService.verify(challenge.challengeId, { code });
    },
    onSuccess: async () => {
      setChallenge(null);
      lastRequest.current = null;
      await invalidateMemberData(queryClient);
    },
  });

  const resend = async (): Promise<void> => {
    verify.reset();
    if (lastRequest.current) {
      await start.mutateAsync(lastRequest.current);
    }
  };

  const cancel = (): void => {
    setChallenge(null);
    lastRequest.current = null;
    start.reset();
    verify.reset();
  };

  return { challenge, start, verify, resend, cancel };
};
