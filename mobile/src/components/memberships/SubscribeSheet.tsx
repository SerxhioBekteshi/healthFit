import React, { useState } from 'react';
import { Banner } from '@/components/ui/Banner';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { CardFields } from '@/components/payments/CardFields';
import { PaymentSheet } from '@/components/payments/PaymentSheet';
import { useClientDashboard } from '@/hooks/dashboard';
import { useMemberships, useSubscribeMembership } from '@/hooks/memberships';
import { useMoney } from '@/hooks/money';
import { usePaymentChallenge } from '@/hooks/payment-challenges';
import { usePaymentSettings } from '@/hooks/payment-settings';
import { useTranslation } from '@/i18n';
import { formatDay } from '@/utils/format';
import { describePlan, nextStart, planPrice } from '@/utils/memberships';
import type { CardSummary, MembershipPlan } from '@gym/shared/types';
import type { SubscribeMembershipValues } from '@gym/shared/validation/memberships';

type SubscribeMethod = SubscribeMembershipValues['paymentMethod'];

interface SubscribeSheetProps {
  // The plan the member tapped; null keeps the sheet closed.
  plan: MembershipPlan | null;
  onClose: () => void;
}

// Buying a plan with credit or card. Cash is only taken by the gym staff.
export const SubscribeSheet: React.FC<SubscribeSheetProps> = ({
  plan,
  onClose,
}) => {
  const { t } = useTranslation();
  const formatMoney = useMoney();
  const balance = useClientDashboard().data?.balance ?? 0;
  const { data: memberships = [] } = useMemberships();
  const settings = usePaymentSettings();
  const subscribe = useSubscribeMembership();
  const payment = usePaymentChallenge();
  const [chosen, setChosen] = useState<SubscribeMethod | null>(null);
  const [card, setCard] = useState<CardSummary | null>(null);
  const [cardAttempted, setCardAttempted] = useState(false);

  const price = plan ? planPrice(plan) : 0;
  const canPayWithBalance = balance >= price;
  const start = nextStart(memberships);
  // The gym decides which of the two ways are open.
  const open: Record<SubscribeMethod, boolean> = {
    balance: settings.acceptBalance,
    card: settings.acceptCard,
  };
  // Credit when it covers the price, otherwise card, until the member picks one.
  const preferred: SubscribeMethod =
    canPayWithBalance && open.balance ? 'balance' : 'card';
  const method: SubscribeMethod | null =
    chosen && open[chosen]
      ? chosen
      : open[preferred]
        ? preferred
        : open.balance
          ? 'balance'
          : open.card
            ? 'card'
            : null;

  const close = (): void => {
    setChosen(null);
    setCard(null);
    setCardAttempted(false);
    subscribe.reset();
    payment.cancel();
    onClose();
  };

  const confirm = async (): Promise<void> => {
    if (!plan || !method) return;
    try {
      if (method === 'balance') {
        await subscribe.mutateAsync({
          planId: plan.id,
          paymentMethod: 'balance',
        });
        close();
        return;
      }
      if (!card) {
        setCardAttempted(true);
        return;
      }
      // The server only charges the card after the one-time code is verified.
      await payment.start.mutateAsync({
        kind: 'membership',
        subscription: { planId: plan.id, paymentMethod: 'card', card },
      });
    } catch {
      // The failure is already shown as a toast and below as a banner.
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

  const error = subscribe.error?.message ?? payment.start.error?.message;

  return (
    <PaymentSheet
      visible={plan !== null}
      title={plan ? describePlan(plan) : t('Subscribe')}
      description={t('Total {{amount}}. Choose how to pay.', {
        amount: formatMoney(price),
      })}
      confirmLabel={method === 'card' ? t('Continue') : t('Confirm')}
      confirmDisabled={
        method === null || (method === 'balance' && !canPayWithBalance)
      }
      isConfirming={subscribe.isPending || payment.start.isPending}
      onConfirm={() => void confirm()}
      challenge={payment.challenge}
      isVerifying={payment.verify.isPending}
      isResending={payment.start.isPending}
      verifyError={payment.verify.error?.message ?? null}
      onVerify={(code) => void verify(code)}
      onResend={() => void payment.resend()}
      onClose={close}
    >
      {error ? <Banner tone="danger" message={error} /> : null}
      {plan?.offer ? (
        <Banner
          tone="success"
          icon="pricetag"
          message={t(
            '{{name}}: {{price}} instead of {{regular}}, until {{date}}.',
            {
              name: plan.offer.name,
              price: formatMoney(plan.offer.price),
              regular: formatMoney(plan.price),
              date: formatDay(plan.offer.endDate),
            }
          )}
        />
      ) : null}
      <Banner
        tone="info"
        message={
          start.queued
            ? t(
                'You already have a membership, so this one starts on {{date}}, right after it ends.',
                { date: formatDay(start.date) }
              )
            : t('This membership starts today.')
        }
      />

      {method === null ? (
        <Banner
          tone="warning"
          message={t(
            'Your gym does not take online payments right now. Please pay at the gym counter.'
          )}
        />
      ) : null}
      {open.balance ? (
        <SelectableCard
          title={t('Credit (balance {{amount}})', {
            amount: formatMoney(balance),
          })}
          description={
            canPayWithBalance
              ? t('Deducted from your balance now.')
              : t('Your balance is too low for this plan.')
          }
          selected={method === 'balance'}
          disabled={!canPayWithBalance}
          onPress={() => setChosen('balance')}
        />
      ) : null}
      {open.card ? (
        <SelectableCard
          title={t('Card')}
          description={t('Charged now, after you confirm with a code.')}
          selected={method === 'card'}
          onPress={() => setChosen('card')}
        />
      ) : null}
      {method === 'card' ? (
        <CardFields onChange={setCard} showErrors={cardAttempted} />
      ) : null}
    </PaymentSheet>
  );
};
