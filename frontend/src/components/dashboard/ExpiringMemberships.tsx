import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { t } from '@/i18n';
import type { GymDashboard } from '@gym/shared/types';

const daysLeft = (endDate: string): string => {
  const diff = Math.ceil(
    (new Date(`${endDate}T00:00:00Z`).getTime() - Date.now()) / 86_400_000
  );
  if (diff <= 0) return t('Ends today');
  return diff === 1 ? t('1 day left') : t('{{n}} days left', { n: diff });
};

export const ExpiringMemberships: React.FC<{
  memberships: GymDashboard['expiringMemberships'];
}> = ({ memberships }) => (
  <div>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-bone">{t('Ending soon')}</p>
      <Link to="/memberships" className="text-xs text-signal hover:underline">
        {t('All memberships')}
      </Link>
    </div>
    {memberships.length === 0 ? (
      <p className="mt-4 text-sm text-bone/40">
        {t('No memberships end in the next 7 days.')}
      </p>
    ) : (
      <ul className="mt-3 divide-y divide-white/[0.07]">
        {memberships.map((item) => (
          <li
            key={`${item.clientName}-${item.endDate}`}
            className="flex items-center gap-3 py-2.5"
          >
            <Avatar name={item.clientName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-bone">
                {item.clientName}
              </p>
              <p className="truncate text-xs text-bone/45">{item.planName}</p>
            </div>
            <p className="shrink-0 text-xs font-medium text-warn">
              {daysLeft(item.endDate)}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
);
