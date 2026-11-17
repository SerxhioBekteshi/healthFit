import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useSecondsLeft } from '@/hooks/countdown';
import { useTranslation } from '@/i18n';
import type { PaymentChallenge } from '@gym/shared/types';
import {
  CHALLENGE_CODE_LENGTH,
  verifyChallengeSchema,
} from '@gym/shared/validation/payment-challenges';
import { VerificationFields } from './VerificationFields';

interface PaymentSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  // Step one: what is bought and how to pay (method choice, card fields).
  children: React.ReactNode;
  confirmLabel: string;
  confirmDisabled?: boolean;
  isConfirming: boolean;
  onConfirm: () => void;
  // Step two appears once the server has started the card payment.
  challenge: PaymentChallenge | null;
  isVerifying: boolean;
  isResending: boolean;
  verifyError: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onClose: () => void;
}

// One sheet for every card payment: step one collects the details, step two asks for the code.
// It stays a single modal, so nothing has to open while another one is closing.
export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  visible,
  title,
  description,
  children,
  confirmLabel,
  confirmDisabled = false,
  isConfirming,
  onConfirm,
  challenge,
  isVerifying,
  isResending,
  verifyError,
  onVerify,
  onResend,
  onClose,
}) => {
  const { t } = useTranslation();
  const [codeEntry, setCodeEntry] = useState<{ id?: string; value: string }>({
    value: '',
  });
  const secondsLeft = useSecondsLeft(challenge?.expiresAt);
  const challengeId = challenge?.challengeId;

  // A code typed for an earlier challenge does not carry over to a new one.
  const code = codeEntry.id === challengeId ? codeEntry.value : '';
  const setCode = (value: string): void =>
    setCodeEntry({ id: challengeId, value });

  const submitCode = (): void => {
    const parsed = verifyChallengeSchema.safeParse({ code });
    if (parsed.success) onVerify(parsed.data.code);
  };

  return (
    <BottomSheet
      visible={visible}
      title={challenge ? t('Verify your payment') : title}
      description={
        challenge
          ? t('Enter the {{n}}-digit code to confirm the payment.', {
              n: CHALLENGE_CODE_LENGTH,
            })
          : description
      }
      onClose={onClose}
      submitLabel={challenge ? t('Verify and pay') : confirmLabel}
      onSubmit={challenge ? submitCode : onConfirm}
      isSubmitting={challenge ? isVerifying : isConfirming}
      submitDisabled={
        challenge
          ? code.length !== CHALLENGE_CODE_LENGTH || secondsLeft === 0
          : confirmDisabled
      }
    >
      {challenge ? (
        <VerificationFields
          challenge={challenge}
          code={code}
          onCodeChange={setCode}
          secondsLeft={secondsLeft}
          error={verifyError}
          isResending={isResending}
          onResend={onResend}
          onSubmit={submitCode}
        />
      ) : (
        children
      )}
    </BottomSheet>
  );
};
