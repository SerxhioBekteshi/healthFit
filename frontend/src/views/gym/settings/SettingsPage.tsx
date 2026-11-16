import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsCard } from '@/components/common/SettingsCard';
import { useAccessSettings } from '@/hooks/access-settings';
import { useGenderSettings } from '@/hooks/gender-settings';
import { usePaymentSettings } from '@/hooks/payment-settings';
import { t } from '@/i18n';
import type {
  AccessSettings,
  GenderSettings,
  PaymentSettings,
} from '@gym/shared/types';
import { accessSettingsSchema } from '@gym/shared/validation/access-settings';
import { genderSettingsSchema } from '@gym/shared/validation/gender-settings';
import { paymentSettingsSchema } from '@gym/shared/validation/payment-settings';

const PaymentCard: React.FC = () => {
  const { settings, isLoading, error, updateSettings } = usePaymentSettings();
  const [draft, setDraft] = useState<PaymentSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const validation = paymentSettingsSchema.safeParse(draft);
  const changed = (Object.keys(settings) as (keyof PaymentSettings)[]).some(
    (key) => settings[key] !== draft[key]
  );

  return (
    <SettingsCard
      title={t('Payment')}
      description={t('Choose how your members can pay at your gym.')}
      options={[
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
      ]}
      draft={draft}
      onToggle={(key, checked) =>
        setDraft((current) => ({ ...current, [key]: checked }))
      }
      isLoading={isLoading}
      loadError={error?.message ?? null}
      isValid={validation.success}
      invalidMessage={t('Keep at least one payment method on.')}
      changed={changed}
      isSaving={updateSettings.isPending}
      saveError={updateSettings.error ? updateSettings.error.message : null}
      onSave={() => {
        if (validation.success) updateSettings.mutate(validation.data);
      }}
    />
  );
};

const AccessCard: React.FC = () => {
  const { settings, isLoading, error, updateSettings } = useAccessSettings();
  const [draft, setDraft] = useState<AccessSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const toggle = (key: keyof AccessSettings, checked: boolean): void =>
    setDraft((current) => {
      const next = { ...current, [key]: checked };
      // Card lockers need member cards turned on.
      if (!next.cardsEnabled) {
        next.lockersUseCard = false;
      }
      return next;
    });

  const validation = accessSettingsSchema.safeParse(draft);
  const changed = (Object.keys(settings) as (keyof AccessSettings)[]).some(
    (key) => settings[key] !== draft[key]
  );

  return (
    <SettingsCard
      title={t('Access')}
      description={t('Choose how members get in and lock their lockers.')}
      options={[
        {
          key: 'cardsEnabled',
          title: t('Member cards'),
          description: t(
            'Each member can get a card that is tapped at the door to check in and out. A member has one active card at a time.'
          ),
        },
        {
          key: 'lockersUseCard',
          title: t('Lock lockers with a card'),
          description: t(
            'The locker is locked and opened with the member card, so the card number is sent when a locker is taken. Turn it off for lockers with a key or padlock, where the member notes the locker number themselves.'
          ),
          disabled: !draft.cardsEnabled,
        },
      ]}
      draft={draft}
      onToggle={toggle}
      isLoading={isLoading}
      loadError={error?.message ?? null}
      isValid={validation.success}
      invalidMessage={t(
        'Locking lockers with a card needs member cards turned on.'
      )}
      changed={changed}
      isSaving={updateSettings.isPending}
      saveError={updateSettings.error ? updateSettings.error.message : null}
      onSave={() => {
        if (validation.success) updateSettings.mutate(validation.data);
      }}
    />
  );
};

const GenderCard: React.FC = () => {
  const { settings, isLoading, error, updateSettings } = useGenderSettings();
  const [draft, setDraft] = useState<GenderSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const validation = genderSettingsSchema.safeParse(draft);
  const changed = (Object.keys(settings) as (keyof GenderSettings)[]).some(
    (key) => settings[key] !== draft[key]
  );

  return (
    <SettingsCard
      title={t('Men and women')}
      description={t(
        'Some gyms price men and women differently, or have a different number of lockers for each.'
      )}
      options={[
        {
          key: 'samePricesForGenders',
          title: t('Same prices for both'),
          description: t(
            'Standard membership prices are shared between men and women instead of set separately.'
          ),
        },
        {
          key: 'sameLockersForGenders',
          title: t('Same lockers for both'),
          description: t(
            'Adding lockers for one changing room adds the same numbers for the other automatically.'
          ),
        },
      ]}
      draft={draft}
      onToggle={(key, checked) =>
        setDraft((current) => ({ ...current, [key]: checked }))
      }
      isLoading={isLoading}
      loadError={error?.message ?? null}
      isValid={validation.success}
      invalidMessage=""
      changed={changed}
      isSaving={updateSettings.isPending}
      saveError={updateSettings.error ? updateSettings.error.message : null}
      onSave={() => {
        if (validation.success) updateSettings.mutate(validation.data);
      }}
    />
  );
};

export const SettingsPage: React.FC = () => (
  <>
    <PageHeader
      title={t('Settings')}
      description={t('Payment and access settings for your gym.')}
    />
    <div className="grid gap-5 lg:grid-cols-2">
      <PaymentCard />
      <AccessCard />
      <GenderCard />
    </div>
  </>
);
