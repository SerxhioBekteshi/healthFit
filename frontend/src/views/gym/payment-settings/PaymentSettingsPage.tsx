import React, { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { usePaymentSettings } from '@/hooks/payment-settings';
import { t } from '@/i18n';
import type { PaymentSettings } from '@gym/shared/types';
import { paymentSettingsSchema } from '@gym/shared/validation/payment-settings';

interface Option {
  key: keyof PaymentSettings;
  title: string;
  description: string;
}

export const PaymentSettingsPage: React.FC = () => {
  const { settings, isLoading, error, updateSettings } = usePaymentSettings();
  const [draft, setDraft] = useState<PaymentSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const options: Option[] = [
    {
      key: 'acceptCard',
      title: t('Card'),
      description: t(
        'Members pay online with a Visa or Mastercard, and staff can take a card at the counter.'
      ),
    },
    {
      key: 'acceptBalance',
      title: t('Credit on the account'),
      description: t(
        'Members keep credit at your gym and pay memberships and products from it. Turning it off also stops top-ups.'
      ),
    },
    {
      key: 'acceptCash',
      title: t('Cash'),
      description: t(
        'Staff take cash at the counter. Shakes and smoothies are cash only, so they cannot be sold without it.'
      ),
    },
  ];

  const validation = paymentSettingsSchema.safeParse(draft);
  const changed = (Object.keys(settings) as (keyof PaymentSettings)[]).some(
    (key) => settings[key] !== draft[key]
  );

  return (
    <>
      <PageHeader
        title={t('Payment settings')}
        description={t('Choose how your members can pay at your gym.')}
      />

      {error ? <Alert className="mb-4">{error.message}</Alert> : null}
      {isLoading ? <Skeleton className="h-64 max-w-2xl" /> : null}

      {!isLoading && !error ? (
        <Card className="max-w-2xl">
          <ul className="divide-y divide-white/[0.07]">
            {options.map((option) => (
              <li
                key={option.key}
                className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-bone">{option.title}</p>
                  <p className="mt-1 text-sm text-bone/55">
                    {option.description}
                  </p>
                </div>
                <Switch
                  label={option.title}
                  checked={draft[option.key]}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      [option.key]: checked,
                    }))
                  }
                />
              </li>
            ))}
          </ul>

          {!validation.success ? (
            <Alert className="mt-5">
              {t('Keep at least one payment method on.')}
            </Alert>
          ) : null}
          {updateSettings.error ? (
            <Alert className="mt-5">{updateSettings.error.message}</Alert>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button
              loading={updateSettings.isPending}
              disabled={!changed || !validation.success}
              onClick={() => {
                if (validation.success) updateSettings.mutate(validation.data);
              }}
            >
              {t('Save')}
            </Button>
          </div>
        </Card>
      ) : null}
    </>
  );
};
