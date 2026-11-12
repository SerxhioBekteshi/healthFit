import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { PaymentChallenge } from '@gym/shared/types';
import { CHALLENGE_CODE_LENGTH } from '@gym/shared/validation/payment-challenges';

interface CardVerificationDialogProps {
  challenge: PaymentChallenge | null;
  isVerifying: boolean;
  isResending: boolean;
  error: string | null;
  onVerify: (code: string) => Promise<unknown>;
  onResend: () => Promise<void>;
  onCancel: () => void;
}

const secondsLeft = (expiresAt: string): number =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));

const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Second factor for card payments: the one-time code the cardholder's bank would send.
export const CardVerificationDialog: React.FC<CardVerificationDialogProps> = ({
  challenge,
  isVerifying,
  isResending,
  error,
  onVerify,
  onResend,
  onCancel,
}) => {
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(0);

  const expiresAt = challenge?.expiresAt;
  useEffect(() => {
    setCode('');
    if (!expiresAt) return;
    setRemaining(secondsLeft(expiresAt));
    const timer = window.setInterval(
      () => setRemaining(secondsLeft(expiresAt)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const expired = challenge !== null && remaining === 0;
  const complete = code.length === CHALLENGE_CODE_LENGTH;

  const submit = async (): Promise<void> => {
    try {
      await onVerify(code);
    } catch {
      // The error is shown below through the error prop.
      setCode('');
    }
  };

  return (
    <Modal
      isOpen={challenge !== null}
      title={t('Verify your payment')}
      description={t(
        'Enter the {{length}}-digit code from your bank to confirm this card payment.',
        { length: CHALLENGE_CODE_LENGTH }
      )}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button
            loading={isVerifying}
            disabled={!complete || expired}
            onClick={submit}
          >
            {t('Verify and pay')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {challenge?.demoCode ? (
          <div className="rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-xs text-warn">
            {t('Demo mode: no SMS is sent. Your code is')}{' '}
            <button
              type="button"
              className="font-bold tracking-widest underline"
              onClick={() => setCode(challenge.demoCode ?? '')}
            >
              {challenge.demoCode}
            </button>{' '}
            {t('(tap to fill it in).')}
          </div>
        ) : null}

        <input
          aria-label={t('Verification code')}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={CHALLENGE_CODE_LENGTH}
          placeholder={'•'.repeat(CHALLENGE_CODE_LENGTH)}
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .replace(/\D/g, '')
                .slice(0, CHALLENGE_CODE_LENGTH)
            )
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && complete && !expired) void submit();
          }}
          className={`${fieldInputClass} py-3 text-center text-2xl font-semibold tracking-[0.6em] tabular-nums`}
        />

        <div className="flex items-center justify-between text-xs text-bone/55">
          <span>
            {expired
              ? t('This code has expired.')
              : t('Code expires in {{time}}', { time: clock(remaining) })}
          </span>
          <button
            type="button"
            disabled={isResending}
            onClick={() => void onResend()}
            className="font-medium text-signal hover:underline disabled:opacity-50"
          >
            {isResending ? t('Sending...') : t('Send a new code')}
          </button>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
};
