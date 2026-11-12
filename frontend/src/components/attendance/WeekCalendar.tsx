import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';
import { WEEKDAYS, weekdayShortLabels } from '@/utils/constants/weekdays';
import { dateTimeFormat } from '@/utils/format';
import type { ClientWeek } from '@gym/shared/types';

const DAY_MS = 86_400_000;

const dayOf = (start: string, offset: number): string =>
  new Date(new Date(`${start}T00:00:00Z`).getTime() + offset * DAY_MS)
    .toISOString()
    .slice(0, 10);

// Seven circles Monday to Sunday: a check marks a day with a check-in, the ring is today.
// Hovering (web) or tapping (mobile) a day shows its date.
export const WeekCalendar: React.FC<{ week: ClientWeek }> = ({ week }) => {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const dateFormat = dateTimeFormat({
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  return (
    <ul className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((weekday, offset) => {
        const name = weekdayShortLabels[weekday];
        const date = dayOf(week.start, offset);
        const checkedIn = week.checkedInDates.includes(date);
        const isToday = date === week.today;
        const label = dateFormat.format(new Date(`${date}T00:00:00Z`));
        const description = [
          label,
          ...(checkedIn ? [t('checked in')] : []),
          ...(isToday ? [t('today')] : []),
        ].join(', ');
        return (
          <li key={date} className="flex justify-center">
            <button
              type="button"
              onClick={() => setOpenDate(openDate === date ? null : date)}
              onBlur={() => setOpenDate(null)}
              aria-label={description}
              className="group relative flex flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  checkedIn
                    ? 'bg-signal text-ink'
                    : isToday
                      ? 'ring-2 ring-signal'
                      : 'bg-white/[0.06]'
                }`}
              >
                {checkedIn ? <Icon name="check" className="h-4 w-4" /> : null}
              </span>
              <span
                className={`text-xs ${isToday ? 'font-semibold text-signal' : 'text-bone/50'}`}
              >
                {name}
              </span>
              <span
                role="tooltip"
                className={`pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-bone shadow-lg ring-1 ring-white/10 group-hover:visible group-hover:opacity-100 ${
                  openDate === date ? 'opacity-100' : 'invisible opacity-0'
                }`}
              >
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
