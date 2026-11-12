import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { t } from '@/i18n';
import {
  WEEKDAYS,
  todayWeekday,
  weekdayLabels,
} from '@/utils/constants/weekdays';
import type { GymClass } from '@gym/shared/types';

// The weekly timetable: one block per day, classes in time order.
export const WeeklySchedule: React.FC<{ classes: GymClass[] }> = ({
  classes,
}) => {
  const today = todayWeekday();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {WEEKDAYS.map((day) => {
        const items = classes
          .filter((item) => item.weekdays.includes(day))
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isToday = day === today;
        return (
          <section
            key={day}
            className={`client-card-reveal rounded-xl border bg-panel p-5 shadow-sm ${
              isToday ? 'border-signal/40' : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-bone">
                {weekdayLabels[day]}
              </h3>
              {isToday ? <Badge tone="success">{t('Today')}</Badge> : null}
            </div>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-bone/40">{t('No classes')}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border border-white/[0.08] bg-ink/60 px-3 py-2.5"
                  >
                    <p className="w-24 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-signal">
                      {item.startTime} - {item.endTime}
                    </p>
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-bone">{item.name}</p>
                      {item.staffMemberName ? (
                        <p className="text-xs text-bone/60">
                          {t('with {{name}}', { name: item.staffMemberName })}
                        </p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-1 text-xs text-bone/45">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};
