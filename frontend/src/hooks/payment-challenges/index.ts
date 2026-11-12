import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentChallengesService } from '@/services/payment-challenges';
import { t } from '@/i18n';
import type {
  PaymentChallenge,
  PaymentChallengeResult,
} from '@gym/shared/types';
import type { StartChallengeValues } from '@gym/shared/validation/payment-challenges';

// Card payment in two steps: start (the server issues a code), then verify (the server charges).
export const usePaymentChallenge = () => {
  const queryClient = useQueryClient();
  const [challenge, setChallenge] = useState<PaymentChallenge | null>(null);
  const lastRequest = useRef<StartChallengeValues | null>(null);

  const start = useMutation({
    meta: { success: 'Verification code sent.' },
    mutationFn: (input: StartChallengeValues) => {
      lastRequest.current = input;
      return paymentChallengesService.start(input);
    },
    onSuccess: setChallenge,
  });

  const verify = useMutation({
    meta: { success: 'Payment verified.' },
    mutationFn: (code: string): Promise<PaymentChallengeResult> => {
      if (!challenge) throw new Error(t('Start the payment again.'));
      return paymentChallengesService.verify(challenge.challengeId, { code });
    },
    onSuccess: async () => {
      setChallenge(null);
      lastRequest.current = null;
      // A verified payment changes the ledger, memberships and the dashboard.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balance'] }),
        queryClient.invalidateQueries({ queryKey: ['memberships'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
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
