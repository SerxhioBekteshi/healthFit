import React from 'react';
import { Link } from 'react-router-dom';
import { CheckInList } from '@/components/attendance/CheckInList';
import { t } from '@/i18n';
import type { GymDashboard } from '@gym/shared/types';

export const RecentCheckIns: React.FC<{
  checkIns: GymDashboard['recentCheckIns'];
}> = ({ checkIns }) => (
  <div>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-bone">{t('Latest check-ins')}</p>
      <Link to="/attendance" className="text-xs text-signal hover:underline">
        {t('Open attendance')}
      </Link>
    </div>
    <CheckInList checkIns={checkIns} />
  </div>
);
