import React from 'react';
import { t } from '@/i18n';
import { dateTimeFormat } from '@/utils/format';
import { AnimatedNumber } from './AnimatedNumber';

interface VisitsChartProps {
  days: { date: string; count: number }[];
}

const BAR_AREA_REM = 7;

// Members per day: bars grow up on first paint, today is highlighted.
export const VisitsChart: React.FC<VisitsChartProps> = ({ days }) => {
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const average = days.length > 0 ? total / days.length : 0;
  const weekday = dateTimeFormat({ weekday: 'short', timeZone: 'UTC' });
  const longDate = dateTimeFormat({
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-bone">
            {t('Members visiting')}
          </p>
          <p className="text-xs text-bone/45">{t('Last 7 days')}</p>
        </div>
        <p className="text-right text-xs text-bone/50">
          <span className="block text-xl font-semibold leading-none text-bone">
            <AnimatedNumber value={total} />
          </span>
          <span className="mt-1 block">
            {t('{{n}} per day', { n: average.toFixed(1) })}
          </span>
        </p>
      </div>

      <div className="mt-5 flex items-end gap-2 sm:gap-3">
        {days.map((day, index) => {
          const isToday = index === days.length - 1;
          const date = new Date(`${day.date}T00:00:00Z`);
          return (
            <div
              key={day.date}
              title={`${longDate.format(date)}: ${day.count}`}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-xs font-medium tabular-nums text-bone/70">
                {day.count}
              </span>
              <div
                className="flex w-full items-end"
                style={{ height: `${BAR_AREA_REM}rem` }}
              >
                <div
                  className={`w-full origin-bottom rounded-md motion-safe:animate-grow-up ${
                    isToday ? 'bg-signal' : 'bg-signal/35'
                  }`}
                  style={{
                    height: `${Math.max((day.count / max) * 100, day.count > 0 ? 6 : 2)}%`,
                    animationDelay: `${index * 70}ms`,
                  }}
                />
              </div>
              <span
                className={`text-xs ${isToday ? 'font-semibold text-signal' : 'text-bone/45'}`}
              >
                {weekday.format(date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
