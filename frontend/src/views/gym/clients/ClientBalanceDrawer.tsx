import React, { useState } from 'react';
import { BalanceTransactionList } from '@/components/balance/BalanceTransactionList';
import { DepositForm } from '@/components/balance/DepositForm';
import { Drawer } from '@/components/ui/Drawer';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBalance } from '@/hooks/balance';
import { usePaymentSettings } from '@/hooks/payment-settings';
import { t } from '@/i18n';
import type { Client } from '@gym/shared/types';
import type { DepositValues } from '@gym/shared/validation/balance';

interface ClientBalanceDrawerProps {
  client: Client | null;
  onClose: () => void;
}

export const ClientBalanceDrawer: React.FC<ClientBalanceDrawerProps> = ({
  client,
  onClose,
}) => {
  const { balance, transactions, isLoading, error, pagination, deposit } =
    useBalance(client?.id, client !== null);
  const [success, setSuccess] = useState<string | null>(null);
  const { settings } = usePaymentSettings();
  // Top-ups follow the gym's payment settings: credit must be in use, and cash or card accepted.
  const depositMethods: DepositValues['paymentMethod'][] = [
    ...(settings.acceptCash ? (['cash'] as const) : []),
    ...(settings.acceptCard ? (['card'] as const) : []),
  ];

  const onDeposit = async (values: DepositValues): Promise<void> => {
    if (!client) return;
    setSuccess(null);
    try {
      await deposit.mutateAsync({ ...values, clientId: client.id });
      setSuccess(t('Funds added.'));
    } catch {
      // The error is shown next to the form through serverError.
    }
  };

  return (
    <Drawer
      isOpen={client !== null}
      title={t('Client balance')}
      description={client ? client.fullName : ''}
      onClose={onClose}
      showSubmit={false}
      cancelLabel={t('Close')}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-bone/55">{t('Current balance')}</p>
          <p className="mt-2 text-4xl font-semibold leading-none tracking-tight tabular-nums text-signal">
            {balance.toFixed(2)}
          </p>
        </div>

        {!settings.acceptBalance ? (
          <Alert tone="warning">
            {t(
              'Your gym does not use balance credit. Turn it on in the payment settings to add funds.'
            )}
          </Alert>
        ) : depositMethods.length === 0 ? (
          <Alert tone="warning">
            {t(
              'Cash and card are both off, so funds cannot be added. Turn one on in the payment settings.'
            )}
          </Alert>
        ) : (
          <DepositForm
            key={depositMethods.join()}
            methods={depositMethods}
            isPending={deposit.isPending}
            serverError={deposit.error?.message ?? null}
            successMessage={success}
            onSubmit={onDeposit}
          />
        )}

        <div>
          <h4 className="mb-3 text-base font-semibold text-bone">
            {t('History')}
          </h4>
          {isLoading ? <Skeleton className="h-32" /> : null}
          {error ? <Alert>{error.message}</Alert> : null}
          {!isLoading && !error ? (
            <Card flush className="overflow-hidden">
              <BalanceTransactionList
                transactions={transactions}
                {...pagination}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
};
