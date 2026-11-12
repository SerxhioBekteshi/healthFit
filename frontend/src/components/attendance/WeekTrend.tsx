import React from 'react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { t } from '@/i18n';
import type { ClientWeek } from '@gym/shared/types';

// This week's visit days against the whole previous week: lower is red, equal blue, higher green.
export const WeekTrend: React.FC<{ week: ClientWeek }> = ({ week }) => {
  const current = week.checkedInDates.length;
  const previous = week.previousVisits;
  if (current === 0 && previous === 0) return null;

  let tone: BadgeTone = 'info';
  let text = t('Same as last week');
  if (previous === 0) {
    tone = 'success';
    text =
      current === 1
        ? t('+1 visit vs last week')
        : t('+{{n}} visits vs last week', { n: current });
  } else if (current !== previous) {
    const change = Math.round(((current - previous) / previous) * 100);
    tone = change < 0 ? 'danger' : 'success';
    text = t('{{change}}% vs last week', {
      change: `${change > 0 ? '+' : '\u2212'}${Math.abs(change)}`,
    });
  }

  return <Badge tone={tone}>{text}</Badge>;
};
