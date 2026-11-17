import React from 'react';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { formatClock } from '@/hooks/countdown';
import { useTranslation } from '@/i18n';
import type { PaymentChallenge } from '@gym/shared/types';
import { CHALLENGE_CODE_LENGTH } from '@gym/shared/validation/payment-challenges';

interface VerificationFieldsProps {
  challenge: PaymentChallenge;
  code: string;
  onCodeChange: (code: string) => void;
  secondsLeft: number;
  error: string | null;
  isResending: boolean;
  onResend: () => void;
  onSubmit: () => void;
}

// Step two of a card payment: the one-time code that confirms it.
export const VerificationFields: React.FC<VerificationFieldsProps> = ({
  challenge,
  code,
  onCodeChange,
  secondsLeft,
  error,
  isResending,
  onResend,
  onSubmit,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {challenge.demoCode ? (
        <>
          <Banner
            tone="info"
            message={t('Demo mode: no SMS is sent. Your code is {{code}}.', {
              code: challenge.demoCode,
            })}
          />
          <Button
            label={t('Fill in the demo code')}
            variant="secondary"
            size="sm"
            onPress={() => onCodeChange(challenge.demoCode ?? '')}
          />
        </>
      ) : null}
      <TextField
        label={t('Verification code')}
        keyboardType="number-pad"
        maxLength={CHALLENGE_CODE_LENGTH}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        value={code}
        onChangeText={(value) => onCodeChange(value.replace(/\D/g, ''))}
        onSubmitEditing={onSubmit}
        error={error ?? undefined}
      />
      <Text variant="caption" tone="muted">
        {secondsLeft === 0
          ? t('This code has expired.')
          : t('Code expires in {{time}}', { time: formatClock(secondsLeft) })}
      </Text>
      <Button
        label={t('Send a new code')}
        variant="ghost"
        size="sm"
        loading={isResending}
        onPress={onResend}
      />
    </>
  );
};
