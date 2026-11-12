import React, { useState } from 'react';
import { CardFields } from '@/components/payments/CardFields';
import { CardVerificationDialog } from '@/components/payments/CardVerificationDialog';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useBalance } from '@/hooks/balance';
import { useMemberships } from '@/hooks/memberships';
import { usePaymentChallenge } from '@/hooks/payment-challenges';
import { msg, t, translated } from '@/i18n';
import { planTerms, weeklyVisitsLabel } from '@/utils/constants/labels';
import { formatDay, formatMoney } from '@/utils/format';
import { nextStart } from '@/utils/memberships';
import type {
  CardSummary,
  Membership,
  MembershipPlan,
} from '@gym/shared/types';
import type { SubscribeMembershipValues } from '@gym/shared/validation/memberships';

type SubscribeMethod = SubscribeMembershipValues['paymentMethod'];

export interface SubscribeResult {
  type: 'success' | 'error';
  message: string;
}

interface SubscribeDialogProps {
  // The plan the client tapped; null keeps the dialog closed.
  plan: MembershipPlan | null;
  onClose: () => void;
  onResult: (result: SubscribeResult) => void;
}

const methodHints = translated<Exclude<SubscribeMethod, 'balance'>>({
  card: msg('Charged now.'),
});

export const describePlan = (plan: MembershipPlan): string => {
  if (plan.type === 'visit_based') {
    return t('{{visits}}, {{valid}}', {
      visits:
        plan.visitCount === 1
          ? t('1 visit')
          : t('{{n}} visits', { n: plan.visitCount }),
      valid:
        plan.durationDays === 1
          ? t('valid 1 day')
          : t('valid {{n}} days', { n: plan.durationDays }),
    });
  }
  const term = planTerms.find((item) => item.type === plan.type);
  return t('{{frequency}}, {{term}}', {
    frequency: weeklyVisitsLabel(plan.weeklyVisits),
    term:
      term?.label ??
      (plan.durationDays === 1
        ? t('1 day')
        : t('{{n}} days', { n: plan.durationDays })),
  });
};

// Pay with credit or card; shared by every place a client can subscribe.
export const SubscribeDialog: React.FC<SubscribeDialogProps> = ({
  plan,
  onClose,
  onResult,
}) => {
  const { balance } = useBalance();
  const { memberships, subscribeMembership } = useMemberships();
  const payment = usePaymentChallenge();
  const [chosen, setChosen] = useState<SubscribeMethod | null>(null);
  const [card, setCard] = useState<CardSummary | null>(null);
  const [cardAttempted, setCardAttempted] = useState(false);

  const canPayWithBalance = plan ? balance >= plan.price : false;
  const start = nextStart(memberships);
  // Credit when it covers the price, otherwise card, until the client picks one.
  const method: SubscribeMethod =
    chosen ?? (canPayWithBalance ? 'balance' : 'card');

  const close = (): void => {
    setChosen(null);
    setCard(null);
    setCardAttempted(false);
    payment.cancel();
    onClose();
  };

  const failed = (error: unknown): void => {
    onResult({
      type: 'error',
      message:
        error instanceof Error ? error.message : t('Subscription failed.'),
    });
    close();
  };

  const subscribed = (membership?: Membership): void => {
    if (plan) {
      onResult({
        type: 'success',
        message: membership
          ? t(
              'You are subscribed: {{plan}}. Starts {{start}} and ends {{end}}.',
              {
                plan: describePlan(plan),
                start: formatDay(membership.startDate),
                end: formatDay(membership.endDate),
              }
            )
          : t('You are subscribed: {{plan}}.', { plan: describePlan(plan) }),
      });
    }
    close();
  };

  const onConfirm = async (): Promise<void> => {
    if (!plan) return;

    if (method === 'card') {
      if (!card) {
        setCardAttempted(true);
        return;
      }
      // The server charges the card only after the one-time code is verified.
      try {
        await payment.start.mutateAsync({
          kind: 'membership',
          subscription: { planId: plan.id, paymentMethod: 'card', card },
        });
      } catch (error) {
        failed(error);
      }
      return;
    }

    try {
      const membership = await subscribeMembership.mutateAsync({
        planId: plan.id,
        paymentMethod: method,
      });
      subscribed(membership);
    } catch (error) {
      failed(error);
    }
  };

  const onVerify = async (code: string): Promise<void> => {
    const result = await payment.verify.mutateAsync(code);
    subscribed(result.kind === 'membership' ? result.membership : undefined);
  };

  const options: { value: SubscribeMethod; label: string; hint: string }[] = [
    {
      value: 'balance',
      label: t('Credit (balance {{amount}})', { amount: formatMoney(balance) }),
      hint: canPayWithBalance
        ? t('Deducted from your balance now.')
        : t('Your balance is too low for this plan.'),
    },
    { value: 'card', label: t('Card'), hint: methodHints.card },
  ];

  return (
    <>
      <Modal
        isOpen={plan !== null && payment.challenge === null}
        title={
          plan
            ? t('Subscribe: {{plan}}', { plan: describePlan(plan) })
            : t('Subscribe')
        }
        description={
          plan
            ? t('Total {{amount}}. Choose how to pay.', {
                amount: formatMoney(plan.price),
              })
            : ''
        }
        onClose={close}
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              {t('Cancel')}
            </Button>
            <Button
              loading={subscribeMembership.isPending || payment.start.isPending}
              disabled={method === 'balance' && !canPayWithBalance}
              onClick={onConfirm}
            >
              {method === 'card' ? t('Continue') : t('Confirm')}
            </Button>
          </>
        }
      >
        <p className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-bone/70">
          {start.queued
            ? t(
                'You already have a membership, so this one starts on {{date}}, right after it ends.',
                { date: formatDay(start.date) }
              )
            : t('This membership starts today.')}
        </p>
        <div
          role="radiogroup"
          aria-label={t('Payment method')}
          className="space-y-2"
        >
          {options.map((option) => {
            const disabled = option.value === 'balance' && !canPayWithBalance;
            const checked = method === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => setChosen(option.value)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  checked
                    ? 'border-signal bg-signal/10'
                    : 'border-white/10 hover:border-white/25'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <p className="text-sm font-medium text-bone">{option.label}</p>
                <p className="mt-0.5 text-xs text-bone/55">{option.hint}</p>
              </button>
            );
          })}
        </div>

        {method === 'card' ? (
          <div className="mt-4">
            <CardFields onChange={setCard} showErrors={cardAttempted} />
          </div>
        ) : null}
      </Modal>

      <CardVerificationDialog
        challenge={payment.challenge}
        isVerifying={payment.verify.isPending}
        isResending={payment.start.isPending}
        error={payment.verify.error?.message ?? null}
        onVerify={onVerify}
        onResend={payment.resend}
        onCancel={close}
      />
    </>
  );
};
