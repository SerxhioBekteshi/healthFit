import React from 'react';
import { t } from '@/i18n';
import { dateTimeFormat } from '@/utils/format';
import { monthWeeks } from '@gym/shared/calendar';

interface MonthCalendarProps {
  // The month to draw, YYYY-MM.
  month: string;
  // Days (YYYY-MM-DD) with a check-in; they are only shown, never picked.
  checkedInDates: string[];
  // Today in the gym's calendar, to ring it.
  today: string;
}

// One date as a Date at midnight UTC, formatted in UTC so the calendar day never shifts.
const utcDate = (date: string): Date => new Date(`${date}T00:00:00Z`);

// A read-only month: Monday first, a filled circle on the days the member checked in.
export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  month,
  checkedInDates,
  today,
}) => {
  const weekdayFormat = dateTimeFormat({ weekday: 'narrow', timeZone: 'UTC' });
  const dayFormat = dateTimeFormat({
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const weeks = monthWeeks(month);
  // 1 January 2024 was a Monday.
  const weekdayHeads = Array.from({ length: 7 }, (_, index) =>
    weekdayFormat.format(new Date(Date.UTC(2024, 0, index + 1)))
  );

  return (
    <div role="grid" aria-label={month} className="select-none">
      <div role="row" className="mb-1 grid grid-cols-7 text-center">
        {weekdayHeads.map((name, index) => (
          <span
            key={index}
            role="columnheader"
            className="py-1 text-xs font-medium text-bone/45"
          >
            {name}
          </span>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} role="row" className="grid grid-cols-7">
          {week.map((date, dayIndex) => {
            if (!date) return <span key={dayIndex} role="gridcell" />;
            const checkedIn = checkedInDates.includes(date);
            const isToday = date === today;
            const description = [
              dayFormat.format(utcDate(date)),
              ...(checkedIn ? [t('checked in')] : []),
              ...(isToday ? [t('today')] : []),
            ].join(', ');
            return (
              <span
                key={date}
                role="gridcell"
                aria-label={description}
                className="flex justify-center py-1"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums ${
                    checkedIn
                      ? 'bg-signal font-semibold text-ink'
                      : isToday
                        ? 'text-signal ring-2 ring-signal'
                        : 'text-bone/70'
                  }`}
                >
                  {Number(date.slice(8))}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
