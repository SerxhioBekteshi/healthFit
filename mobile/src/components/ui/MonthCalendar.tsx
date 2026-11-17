import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { formatLongDay } from '@/utils/format';
import { WEEKDAYS, weekdayName } from '@/utils/weekdays';
import { monthWeeks } from '@gym/shared/calendar';
import { Text } from './Text';

interface MonthCalendarProps {
  // The month to draw, YYYY-MM.
  month: string;
  // Today (YYYY-MM-DD), ringed.
  today?: string;
  // Days drawn filled, for example the days with a check-in; `markedLabel` describes them to screen readers.
  markedDates?: string[];
  markedLabel?: string;
  // Makes the days tappable, for picking a date; the selected one is drawn filled.
  selected?: string | null;
  onSelect?: (date: string) => void;
}

const DAY_SIZE = 36;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row' },
    cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
    head: { paddingBottom: theme.spacing.xs },
    day: {
      width: DAY_SIZE,
      height: DAY_SIZE,
      borderRadius: DAY_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
  });

// A month, Monday first. Read-only by default; pass `onSelect` to let the member pick a day.
export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  month,
  today,
  markedDates = [],
  markedLabel = '',
  selected = null,
  onSelect,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const weeks = monthWeeks(month);

  return (
    <View accessibilityRole="grid">
      <View style={styles.row}>
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} style={[styles.cell, styles.head]}>
            <Text variant="label" tone="subtle">
              {weekdayName(weekday, 'narrow')}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((date, dayIndex) => {
            if (!date) return <View key={dayIndex} style={styles.cell} />;
            const filled = markedDates.includes(date) || date === selected;
            const isToday = date === today;
            const description = [
              formatLongDay(date),
              ...(markedDates.includes(date) && markedLabel
                ? [markedLabel]
                : []),
              ...(isToday ? [t('today')] : []),
            ].join(', ');
            const day = (
              <View
                accessible={!onSelect}
                accessibilityLabel={onSelect ? undefined : description}
                style={[
                  styles.day,
                  filled ? { backgroundColor: colors.accent } : null,
                  isToday && !filled ? { borderColor: colors.accent } : null,
                ]}
              >
                <Text
                  variant="caption"
                  style={{
                    color: filled
                      ? colors.onAccent
                      : isToday
                        ? colors.accent
                        : colors.textMuted,
                    fontWeight: filled ? '700' : '400',
                  }}
                >
                  {Number(date.slice(8))}
                </Text>
              </View>
            );
            return (
              <View key={date} style={styles.cell}>
                {onSelect ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={description}
                    accessibilityState={{ selected: date === selected }}
                    onPress={() => onSelect(date)}
                  >
                    {day}
                  </Pressable>
                ) : (
                  day
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};
