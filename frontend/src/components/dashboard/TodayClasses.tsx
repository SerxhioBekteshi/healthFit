import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { t } from '@/i18n';
import { todayWeekday } from '@/utils/constants/weekdays';
import type { GymClass } from '@gym/shared/types';

const nowTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// Classes of the current weekday in time order; the one running now is marked.
export const TodayClasses: React.FC<{ classes: GymClass[] }> = ({
  classes,
}) => {
  const today = todayWeekday();
  const now = nowTime();
  const items = classes
    .filter((item) => item.isActive && item.weekdays.includes(today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-bone">{t("Today's classes")}</p>
        <Link to="/classes" className="text-xs text-signal hover:underline">
          {t('Manage')}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-bone/40">{t('No classes today.')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const running = item.startTime <= now && now < item.endTime;
            const finished = item.endTime <= now;
            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  running
                    ? 'border-signal/40 bg-signal/10'
                    : 'border-white/[0.08] bg-ink/60'
                } ${finished ? 'opacity-50' : ''}`}
              >
                <p className="w-12 shrink-0 text-sm font-semibold tabular-nums text-signal">
                  {item.startTime}
                </p>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-bone">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-bone/50">
                    {item.staffMemberName ?? t('No instructor yet')}
                  </p>
                </div>
                {running ? <Badge tone="success">{t('Now')}</Badge> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
