import React, { useState } from 'react';
import { Banner } from '@/components/ui/Banner';
import { TextField } from '@/components/ui/TextField';
import { CardFields } from '@/components/payments/CardFields';
import { PaymentSheet } from '@/components/payments/PaymentSheet';
import { useMoney } from '@/hooks/money';
import { usePaymentChallenge } from '@/hooks/payment-challenges';
import { useTranslation } from '@/i18n';
import type { CardSummary } from '@gym/shared/types';
import { depositFormSchema } from '@gym/shared/validation/balance';

interface TopUpSheetProps {
  visible: boolean;
  onClose: () => void;
}

// Adding credit with a card: the amount, the card, then the one-time code.
export const TopUpSheet: React.FC<TopUpSheetProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const formatMoney = useMoney();
  const payment = usePaymentChallenge();
  const [amountText, setAmountText] = useState('');
  const [card, setCard] = useState<CardSummary | null>(null);
  const [attempted, setAttempted] = useState(false);

  // "12,5" and "12.5" both work, as on a phone keyboard.
  const amount = Number(amountText.replace(',', '.'));
  const parsed = depositFormSchema.safeParse({
    amount: amountText.trim() === '' ? undefined : amount,
    paymentMethod: 'card',
    card: card ?? undefined,
  });
  const amountMessage = parsed.error?.issues.find(
    (issue) => issue.path[0] === 'amount'
  )?.message;
  const amountError = attempted && amountMessage ? t(amountMessage) : undefined;

  const close = (): void => {
    setAmountText('');
    setCard(null);
    setAttempted(false);
    payment.cancel();
    onClose();
  };

  const confirm = async (): Promise<void> => {
    setAttempted(true);
    if (!parsed.success || !card) return;
    try {
      await payment.start.mutateAsync({
        kind: 'deposit',
        deposit: { amount: parsed.data.amount, paymentMethod: 'card', card },
      });
    } catch {
      // Already shown as a toast and below as a banner.
    }
  };

  const verify = async (code: string): Promise<void> => {
    try {
      await payment.verify.mutateAsync(code);
      close();
    } catch {
      // Shown under the code field.
    }
  };

  return (
    <PaymentSheet
      visible={visible}
      title={t('Top up your balance')}
      description={t(
        'Credit can pay for memberships and products at your gym.'
      )}
      confirmLabel={t('Continue')}
      isConfirming={payment.start.isPending}
      onConfirm={() => void confirm()}
      challenge={payment.challenge}
      isVerifying={payment.verify.isPending}
      isResending={payment.start.isPending}
      verifyError={payment.verify.error?.message ?? null}
      onVerify={(code) => void verify(code)}
      onResend={() => void payment.resend()}
      onClose={close}
    >
      {payment.start.error ? (
        <Banner tone="danger" message={payment.start.error.message} />
      ) : null}
      <TextField
        label={t('Amount')}
        placeholder="0"
        keyboardType="decimal-pad"
        value={amountText}
        onChangeText={setAmountText}
        error={amountError}
        hint={
          parsed.success
            ? t('You will add {{amount}}.', {
                amount: formatMoney(parsed.data.amount),
              })
            : undefined
        }
      />
      <CardFields onChange={setCard} showErrors={attempted} />
    </PaymentSheet>
  );
};
