import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { fieldInputClass } from '@/components/common/FormField';
import { useAccessSettings } from '@/hooks/access-settings';
import { useCheckOut } from '@/hooks/attendance';
import { useLockerActions } from '@/hooks/lockers';
import { t } from '@/i18n';
import type { ClientDashboard } from '@gym/shared/types';

interface AccessPanelProps {
  data: Pick<ClientDashboard, 'card' | 'checkedIn' | 'locker'>;
}

// The member's card, whether they are inside, and which locker holds their things.
export const AccessPanel: React.FC<AccessPanelProps> = ({ data }) => {
  const { settings } = useAccessSettings();
  const checkOut = useCheckOut();
  const { assignLocker, releaseLocker } = useLockerActions();
  const [lockerNumber, setLockerNumber] = useState('');

  const canPickLocker = !settings.lockersUseCard && data.checkedIn;
  const error =
    checkOut.error ?? assignLocker.error ?? releaseLocker.error ?? null;

  return (
    <div className="client-card-reveal rounded-xl border border-white/10 bg-panel px-5 py-4 shadow-sm">
      <dl className="grid grid-cols-2 gap-4">
        {settings.cardsEnabled ? (
          <div>
            <dt className="text-xs text-bone/50">{t('My card')}</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold text-bone">
              {data.card ?? t('No card yet')}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-bone/50">{t('My locker')}</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-bone">
            {data.locker
              ? data.locker.lockerNumber
              : data.checkedIn
                ? t('None yet')
                : '—'}
          </dd>
          {data.locker?.locationName ? (
            <dd className="text-xs text-bone/45">{data.locker.locationName}</dd>
          ) : null}
        </div>
      </dl>

      {settings.lockersUseCard && data.checkedIn && !data.locker ? (
        <p className="mt-3 text-xs text-bone/55">
          {t('Lock a locker with your card and its number shows here.')}
        </p>
      ) : null}

      {canPickLocker && !data.locker ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            assignLocker.mutate(
              { lockerNumber: lockerNumber.trim() },
              { onSuccess: () => setLockerNumber('') }
            );
          }}
        >
          <label htmlFor="my-locker" className="sr-only">
            {t('Locker number')}
          </label>
          <input
            id="my-locker"
            autoComplete="off"
            value={lockerNumber}
            onChange={(event) => setLockerNumber(event.target.value)}
            placeholder={t('Which locker are you using?')}
            className={`${fieldInputClass} flex-1`}
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            loading={assignLocker.isPending}
            disabled={!lockerNumber.trim()}
          >
            {t('Save')}
          </Button>
        </form>
      ) : null}

      {data.checkedIn ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <span className="flex items-center gap-2 text-sm text-bone/65">
            <span className="h-2 w-2 rounded-full bg-signal" />
            {t('You are checked in')}
          </span>
          <div className="flex gap-2">
            {data.locker && !settings.lockersUseCard ? (
              <Button
                size="sm"
                variant="ghost"
                loading={releaseLocker.isPending}
                onClick={() => releaseLocker.mutate({})}
              >
                {t('Free my locker')}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              loading={checkOut.isPending}
              onClick={() => checkOut.mutate()}
            >
              {t('Check out')}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <Alert className="mt-3">{error.message}</Alert> : null}
    </div>
  );
};
