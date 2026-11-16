import React, { useCallback, useEffect, useState } from 'react';
import { CheckInList } from '@/components/attendance/CheckInList';
import { MiniStat } from '@/components/dashboard/MiniStat';
import { DevScanSimulator } from '@/components/common/DevScanSimulator';
import { fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAccessSettings } from '@/hooks/access-settings';
import { useAttendance } from '@/hooks/attendance';
import { useClients } from '@/hooks/clients';
import { useGymLocations } from '@/hooks/gym-locations';
import { useMemberCards } from '@/hooks/member-cards';
import { t } from '@/i18n';
import { formatTime } from '@/utils/format';
import { QrScanner } from './QrScanner';

const LATEST_LIMIT = 10;
const FEEDBACK_MS = 6000;
// A desk stays at one gym, so the choice is remembered on this device.
const DESK_LOCATION_KEY = 'desk-location';

type Feedback =
  | {
      type: 'success';
      action: 'checked_in' | 'checked_out';
      name: string;
      time: string;
      location: string | null;
      locker: string | null;
    }
  | { type: 'error'; message: string }
  | null;

export const AttendancePage: React.FC = () => {
  const { records, stats, isLoading, error, scan } =
    useAttendance(LATEST_LIMIT);
  const { activeLocations } = useGymLocations();
  const { settings } = useAccessSettings();
  // Only used to simulate a reader in development; never fetched in production.
  const { clients } = useClients();
  const { cards } = useMemberCards();
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [savedLocationId, setSavedLocationId] = useState(
    () => window.localStorage.getItem(DESK_LOCATION_KEY) ?? ''
  );

  const hasSeveralLocations = activeLocations.length > 1;
  const locationId = (
    activeLocations.find((location) => location.id === savedLocationId) ??
    activeLocations[0]
  )?.id;

  const chooseLocation = (id: string): void => {
    setSavedLocationId(id);
    window.localStorage.setItem(DESK_LOCATION_KEY, id);
  };

  // The banner clears itself so the desk is ready for the next member.
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const submitCheckIn = useCallback(
    async (rawCode: string): Promise<void> => {
      const trimmed = rawCode.trim();
      if (!trimmed) {
        setFeedback({ type: 'error', message: t('Enter a check-in code.') });
        return;
      }
      try {
        const { action, record } = await scan.mutateAsync({
          code: trimmed,
          locationId,
        });
        setFeedback({
          type: 'success',
          action,
          name: record.clientName,
          time: formatTime(
            action === 'checked_in'
              ? record.checkedInAt
              : (record.checkedOutAt ?? record.checkedInAt)
          ),
          location: record.locationName,
          locker: record.lockerNumber,
        });
        setCode('');
      } catch (submitError) {
        setFeedback({
          type: 'error',
          message:
            submitError instanceof Error
              ? submitError.message
              : t('Check-in failed.'),
        });
      }
    },
    [scan, locationId]
  );

  const onSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    await submitCheckIn(code);
  };

  const onScanned = useCallback(
    (value: string): void => {
      setCode(value);
      void submitCheckIn(value);
    },
    [submitCheckIn]
  );

  return (
    <>
      <PageHeader
        eyebrow={t('Members')}
        title={t('Door')}
        accent={t('attendance')}
        description={t('Check members in and out at the desk.')}
      />

      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat
            index={0}
            icon="scan"
            label={t('Today')}
            value={stats.today}
            accent
          />
          <MiniStat
            index={1}
            icon="users"
            label={t('Inside now')}
            value={stats.currentlyInside}
            live
          />
          <MiniStat
            index={2}
            icon="clock"
            label={t('This week')}
            value={stats.thisWeek}
          />
          <MiniStat
            index={3}
            icon="trend"
            label={t('This month')}
            value={stats.thisMonth}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card flush className="p-5 lg:col-span-3">
            <p className="text-base font-semibold text-bone">
              {t('Check in or out a member')}
            </p>
            <p className="mt-1 text-sm text-bone/55">
              {t(
                "Scan the QR on the member's phone, tap their card or paste their code. The same scan checks them out when they are inside."
              )}
            </p>

            {hasSeveralLocations ? (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-medium text-bone/50">
                  {t('Checking in at')}
                </span>
                <select
                  value={locationId}
                  onChange={(event) => chooseLocation(event.target.value)}
                  className={fieldInputClass}
                >
                  {activeLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <form
              onSubmit={onSubmit}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="attendance-code" className="sr-only">
                {t('Check-in code')}
              </label>
              <input
                id="attendance-code"
                type="text"
                autoFocus
                autoComplete="off"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder={
                  settings.cardsEnabled
                    ? t('Tap a card or paste the member code')
                    : t('Paste or scan the member code')
                }
                className={`${fieldInputClass} flex-1 font-mono`}
              />
              <Button type="submit" loading={scan.isPending} icon="scan">
                {scan.isPending ? t('Scanning') : t('Check in / out')}
              </Button>
            </form>

            {import.meta.env.DEV ? (
              <DevScanSimulator
                clients={clients}
                cards={cards}
                onSimulate={onScanned}
              />
            ) : null}

            {feedback?.type === 'success' ? (
              <div
                role="status"
                className="mt-4 flex items-center gap-3 rounded-xl border border-signal/30 bg-signal/10 px-4 py-3 motion-safe:animate-fade-up"
              >
                <Avatar name={feedback.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-bone">
                    {feedback.name}
                  </p>
                  <p className="text-xs text-signal">
                    {feedback.action === 'checked_out'
                      ? feedback.locker
                        ? t(
                            'Checked out at {{time}} - locker {{locker}} is free',
                            {
                              time: feedback.time,
                              locker: feedback.locker,
                            }
                          )
                        : t('Checked out at {{time}}', { time: feedback.time })
                      : feedback.location
                        ? t('Checked in at {{time}} - {{location}}', {
                            time: feedback.time,
                            location: feedback.location,
                          })
                        : t('Checked in at {{time}}', { time: feedback.time })}
                  </p>
                </div>
              </div>
            ) : null}
            {feedback?.type === 'error' ? (
              <Alert className="mt-4">{feedback.message}</Alert>
            ) : null}

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-medium text-bone/50">
                {t('Camera scan')}
              </p>
              <QrScanner
                onDecoded={onScanned}
                onError={(message) => setFeedback({ type: 'error', message })}
              />
            </div>
          </Card>

          <Card flush className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-bone">
                {t('Latest check-ins')}
              </p>
              <p className="text-xs text-bone/40">
                {t('Last {{n}}', { n: LATEST_LIMIT })}
              </p>
            </div>
            {error ? <Alert className="mt-3">{error.message}</Alert> : null}
            {isLoading ? (
              <div className="mt-3 space-y-2" aria-busy="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-10" />
                ))}
              </div>
            ) : (
              <CheckInList
                checkIns={records}
                showLocation={hasSeveralLocations}
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
};
