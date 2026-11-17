import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { weekdayName } from '@/utils/weekdays';
import type { ClientWeek } from '@gym/shared/types';
import { WeekTrend } from './WeekTrend';

interface WeekCalendarProps {
  week: ClientWeek;
  // Opens the read-only calendar of every day the member has been to the gym.
  onOpenHistory: () => void;
}

const DAY_MS = 86_400_000;
const DAY_SIZE = 38;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    // The title wraps in languages with long words instead of pushing the button out.
    title: { flexShrink: 1 },
    summary: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.xs,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    visits: { flexShrink: 1 },
    days: { flexDirection: 'row', justifyContent: 'space-between' },
    day: { alignItems: 'center', gap: theme.spacing.xs },
    circle: {
      width: DAY_SIZE,
      height: DAY_SIZE,
      borderRadius: DAY_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
  });

const addDays = (date: string, days: number): string =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);

// The seven days of the current week, with the days the member trained filled in.
export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  week,
  onOpenHistory,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const visitCount = week.checkedInDates.length;
  const visits =
    visitCount === 1 ? t('1 visit') : t('{{n}} visits', { n: visitCount });

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="label" tone="muted" style={styles.title}>
          {t('THIS WEEK')}
        </Text>
        <Button
          label={t('History')}
          icon="calendar-outline"
          size="sm"
          variant="secondary"
          onPress={onOpenHistory}
        />
      </View>
      <View style={styles.summary}>
        <Text variant="bodyStrong" style={styles.visits}>
          {visits}
        </Text>
        <WeekTrend week={week} />
      </View>
      <View style={styles.days}>
        {Array.from({ length: 7 }, (_, index) => {
          const date = addDays(week.start, index);
          const trained = week.checkedInDates.includes(date);
          const isToday = date === week.today;
          const name = weekdayName(index + 1, 'short');
          return (
            <View key={date} style={styles.day}>
              <Text variant="label" tone="subtle" numberOfLines={1}>
                {name}
              </Text>
              <View
                accessible
                accessibilityLabel={`${name}${trained ? `, ${t('trained')}` : ''}${isToday ? `, ${t('today')}` : ''}`}
                style={[
                  styles.circle,
                  trained ? { backgroundColor: colors.accent } : null,
                  isToday && !trained ? { borderColor: colors.accent } : null,
                ]}
              >
                {trained ? (
                  <Icon name="checkmark" size={20} color="onAccent" />
                ) : (
                  <Text variant="caption" tone={isToday ? 'accent' : 'muted'}>
                    {Number(date.slice(8))}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};
