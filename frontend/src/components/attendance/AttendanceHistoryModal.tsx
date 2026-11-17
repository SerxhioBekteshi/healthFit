import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAttendanceDays } from '@/hooks/attendance';
import { t } from '@/i18n';
import { dateTimeFormat } from '@/utils/format';
import { monthOf, shiftMonth } from '@gym/shared/calendar';
import { MonthCalendar } from './MonthCalendar';

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  // Today in the gym's calendar (YYYY-MM-DD); the calendar opens on its month and cannot go past it.
  today: string;
  onClose: () => void;
}

const navButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-bone/70 transition-colors hover:bg-white/10 hover:text-bone disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

// The days the member has been to the gym, month by month. It only shows; nothing is picked.
export const AttendanceHistoryModal: React.FC<AttendanceHistoryModalProps> = ({
  isOpen,
  today,
  onClose,
}) => {
  const currentMonth = monthOf(today);
  const [month, setMonth] = useState(currentMonth);
  const { data, isLoading, error } = useAttendanceDays(month, isOpen);

  const label = dateTimeFormat({
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
  const count = data?.days.length ?? 0;

  const close = (): void => {
    setMonth(currentMonth);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={t('Check-in history')}
      description={t('Days you checked in are highlighted.')}
      onClose={close}
      footer={<Button onClick={close}>{t('Close')}</Button>}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className={navButton}
          aria-label={t('Previous month')}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <Icon name="chevron" className="h-4 w-4 rotate-180" />
        </button>
        <p className="text-sm font-semibold capitalize text-bone">{label}</p>
        <button
          type="button"
          className={navButton}
          aria-label={t('Next month')}
          disabled={month >= currentMonth}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <Icon name="chevron" className="h-4 w-4" />
        </button>
      </div>

      {error ? <Alert>{error.message}</Alert> : null}
      {isLoading ? <Skeleton className="h-60" /> : null}
      {data ? (
        <>
          <MonthCalendar
            month={month}
            checkedInDates={data.days}
            today={today}
          />
          <p className="mt-4 border-t border-white/10 pt-3 text-center text-sm text-bone/65">
            {count === 1
              ? t('1 day with a check-in')
              : t('{{n}} days with a check-in', { n: count })}
          </p>
        </>
      ) : null}
    </Modal>
  );
};
