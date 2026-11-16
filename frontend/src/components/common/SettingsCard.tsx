import React from 'react';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { t } from '@/i18n';

export interface SettingsSwitchOption<T> {
  key: keyof T;
  title: string;
  description: string;
  disabled?: boolean;
}

interface SettingsCardProps<T> {
  title: string;
  description: string;
  options: SettingsSwitchOption<T>[];
  draft: T;
  onToggle: (key: keyof T, checked: boolean) => void;
  isLoading: boolean;
  loadError: string | null;
  isValid: boolean;
  invalidMessage: string;
  changed: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: () => void;
  footer?: React.ReactNode;
}

// One settings block: a title, on/off options and a Save button. Used for payment and access settings.
export function SettingsCard<T extends object>({
  title,
  description,
  options,
  draft,
  onToggle,
  isLoading,
  loadError,
  isValid,
  invalidMessage,
  changed,
  isSaving,
  saveError,
  onSave,
  footer,
}: SettingsCardProps<T>): React.ReactElement {
  return (
    <Card>
      <h2 className="font-semibold text-bone">{title}</h2>
      <p className="mt-1 text-sm text-bone/55">{description}</p>

      {loadError ? <Alert className="mt-4">{loadError}</Alert> : null}
      {isLoading ? <Skeleton className="mt-4 h-48" /> : null}

      {!isLoading && !loadError ? (
        <>
          <ul className="mt-4 divide-y divide-white/[0.07]">
            {options.map((option) => (
              <li
                key={String(option.key)}
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
                  checked={Boolean(draft[option.key])}
                  disabled={option.disabled}
                  onChange={(checked) => onToggle(option.key, checked)}
                />
              </li>
            ))}
          </ul>

          {!isValid ? <Alert className="mt-5">{invalidMessage}</Alert> : null}
          {saveError ? <Alert className="mt-5">{saveError}</Alert> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            {footer ?? <span />}
            <Button
              loading={isSaving}
              disabled={!changed || !isValid}
              onClick={onSave}
            >
              {t('Save')}
            </Button>
          </div>
        </>
      ) : null}
    </Card>
  );
}
