import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { useTranslation } from '@/i18n';
import type { ClientWeek } from '@gym/shared/types';

interface WeekTrendProps {
  week: ClientWeek;
}

// This week's visit days against the whole previous week: lower is red, equal blue, higher green.
// Nothing shows when there were no visits in either week.
export const WeekTrend: React.FC<WeekTrendProps> = ({ week }) => {
  const { t } = useTranslation();
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

  // Shrinkable, so a long text in another language wraps inside the card instead of running off it.
  return (
    <View style={styles.shrink}>
      <Badge label={text} tone={tone} />
    </View>
  );
};

const styles = StyleSheet.create({ shrink: { flexShrink: 1 } });
