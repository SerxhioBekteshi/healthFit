import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { useAccessSettings } from '@/hooks/access-settings';
import { t } from '@/i18n';
import type { AccessSettings } from '@gym/shared/types';
import { accessSettingsSchema } from '@gym/shared/validation/access-settings';

interface Option {
  key: keyof AccessSettings;
  title: string;
  description: string;
  disabled?: boolean;
}

export const AccessSettingsPage: React.FC = () => {
  const { settings, isLoading, error, updateSettings } = useAccessSettings();
  const [draft, setDraft] = useState<AccessSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const options: Option[] = [
    {
      key: 'cardsEnabled',
      title: t('Member cards'),
      description: t(
        'Each member can get a card that is tapped at the door to check in and out. A member has one active card at a time.'
      ),
    },
    {
      key: 'lockersEnabled',
      title: t('Lockers'),
      description: t(
        'Members can leave their things in a locker during a visit. A locker is free again when the member checks out.'
      ),
    },
    {
      key: 'lockersUseCard',
      title: t('Lock lockers with the card'),
      description: t(
        'The locker is locked and opened with the member card, so the card number is sent when a locker is taken. Turn it off for lockers with a key or padlock, where the member notes the locker number.'
      ),
      disabled: !draft.cardsEnabled || !draft.lockersEnabled,
    },
  ];

  const set = (key: keyof AccessSettings, checked: boolean): void =>
    setDraft((current) => {
      const next = { ...current, [key]: checked };
      // Card lockers need both cards and lockers.
      if (!next.cardsEnabled || !next.lockersEnabled) {
        next.lockersUseCard = false;
      }
      return next;
    });

  const validation = accessSettingsSchema.safeParse(draft);
  const changed = (Object.keys(settings) as (keyof AccessSettings)[]).some(
    (key) => settings[key] !== draft[key]
  );

  return (
    <>
      <PageHeader
        title={t('Access settings')}
        description={t('Choose how members get in and keep their things.')}
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
                  disabled={option.disabled}
                  onChange={(checked) => set(option.key, checked)}
                />
              </li>
            ))}
          </ul>

          {!validation.success ? (
            <Alert className="mt-5">
              {t(
                'Locking lockers with a card needs cards and lockers turned on.'
              )}
            </Alert>
          ) : null}
          {updateSettings.error ? (
            <Alert className="mt-5">{updateSettings.error.message}</Alert>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs text-bone/50">
              {t(
                'Issue cards on the Cards page and add lockers on the Lockers page.'
              )}{' '}
              <Link to="/member-cards" className="text-signal hover:underline">
                {t('Cards')}
              </Link>
              {' · '}
              <Link to="/lockers" className="text-signal hover:underline">
                {t('Lockers')}
              </Link>
            </p>
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
