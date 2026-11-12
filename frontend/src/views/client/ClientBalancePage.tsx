import React, { useMemo, useState } from 'react';
import { BalanceFilters } from '@/components/balance/BalanceFilters';
import { BalanceTransactionList } from '@/components/balance/BalanceTransactionList';
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';
import { DepositForm } from '@/components/balance/DepositForm';
import { CardVerificationDialog } from '@/components/payments/CardVerificationDialog';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBalance } from '@/hooks/balance';
import { useDebouncedValue } from '@/hooks/debounce';
import { usePaymentChallenge } from '@/hooks/payment-challenges';
import { t } from '@/i18n';
import { countFilters, sendableBalanceFilters } from '@/utils/filters';
import { formatMoney } from '@/utils/format';
import type { BalanceHistoryFilters } from '@gym/shared/types';
import type { DepositValues } from '@gym/shared/validation/balance';

export const ClientBalancePage: React.FC = () => {
  const [filters, setFilters] = useState<BalanceHistoryFilters>({});
  // Typing pauses before the history is requested again.
  const applied = useDebouncedValue(
    useMemo(() => sendableBalanceFilters(filters), [filters])
  );
  const { balance, transactions, isLoading, isFiltering, error, pagination } =
    useBalance(undefined, true, applied);
  const payment = usePaymentChallenge();
  const [success, setSuccess] = useState<string | null>(null);

  // The deposit is only charged after the one-time code is verified.
  const onDeposit = async (values: DepositValues): Promise<void> => {
    setSuccess(null);
    try {
      await payment.start.mutateAsync({ kind: 'deposit', deposit: values });
    } catch {
      // The error is shown next to the form through serverError.
    }
  };

  const onVerify = async (code: string): Promise<void> => {
    await payment.verify.mutateAsync(code);
    setSuccess(t('Payment verified. The deposit was added to your balance.'));
  };

  return (
    <>
      <PageHeader title={t('Your')} accent={t('balance')} />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="client-card-reveal lg:col-span-3">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <p className="text-sm text-bone/55">{t('Available balance')}</p>
              <p className="mt-2 text-4xl font-semibold leading-none tracking-tight tabular-nums text-signal">
                <AnimatedNumber value={balance} format={formatMoney} />
              </p>
            </div>
            <p className="max-w-[15rem] text-sm text-bone/50">
              {t('Spend it on memberships and products at your gym.')}
            </p>
          </div>

          <div className="my-4 border-t border-white/10" />

          <p className="mb-3 text-sm text-bone/55">
            <span className="text-base font-semibold text-bone">
              {t('Top up')}
            </span>
            {' · '}
            {t('Add funds with your Visa or Mastercard.')}
          </p>
          <DepositForm
            compact
            methods={['card']}
            isPending={payment.start.isPending}
            serverError={payment.start.error?.message ?? null}
            successMessage={success}
            onSubmit={onDeposit}
          />
        </Card>

        <Card
          flush
          className="client-card-reveal flex flex-col self-start overflow-hidden lg:col-span-2"
        >
          <FilterBar
            title={t('Transaction history')}
            activeCount={countFilters(filters)}
            onClear={() => setFilters({})}
            className="border-b border-white/[0.06] px-5 py-3"
          >
            <BalanceFilters value={filters} onChange={setFilters} />
          </FilterBar>
          {error ? <Alert className="m-4">{error.message}</Alert> : null}
          {isLoading ? <Skeleton className="m-4 h-48" /> : null}
          {!isLoading && !error ? (
            // About five rows are visible; the rest load as this area scrolls.
            <div
              className={`max-h-[29rem] min-h-0 flex-1 overflow-y-auto transition-opacity ${
                isFiltering ? 'opacity-50' : ''
              }`}
            >
              <BalanceTransactionList
                transactions={transactions}
                filtered={countFilters(applied) > 0}
                {...pagination}
              />
            </div>
          ) : null}
        </Card>
      </div>

      <CardVerificationDialog
        challenge={payment.challenge}
        isVerifying={payment.verify.isPending}
        isResending={payment.start.isPending}
        error={payment.verify.error?.message ?? null}
        onVerify={onVerify}
        onResend={payment.resend}
        onCancel={payment.cancel}
      />
    </>
  );
};
