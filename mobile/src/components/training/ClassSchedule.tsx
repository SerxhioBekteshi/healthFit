import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ChipRow } from '@/components/ui/ChipRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { todayWeekday, WEEKDAYS, weekdayName } from '@/utils/weekdays';
import type { GymClass } from '@gym/shared/types';

interface ClassScheduleProps {
  classes: GymClass[];
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.md },
    row: { flexDirection: 'row', gap: theme.spacing.lg },
    time: { width: 92, gap: 2 },
    info: { flex: 1, gap: 2 },
  });

// The weekly timetable: pick a day, see its classes in order of time.
export const ClassSchedule: React.FC<ClassScheduleProps> = ({ classes }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const today = todayWeekday();
  const [day, setDay] = useState<number>(today);

  const ofDay = classes
    .filter((item) => item.weekdays.includes(day))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <View style={styles.stack}>
      <ChipRow
        options={WEEKDAYS.map((value) => ({
          value,
          label: weekdayName(value, 'short'),
        }))}
        value={day}
        onChange={setDay}
        marked={today}
      />
      {ofDay.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('No classes on {{day}}', { day: weekdayName(day, 'long') })}
          message={t('Pick another day to see the timetable.')}
        />
      ) : (
        ofDay.map((item) => (
          <Card key={item.id}>
            <View style={styles.row}>
              <View style={styles.time}>
                <Text variant="bodyStrong">{item.startTime}</Text>
                <Text variant="caption" tone="muted">
                  {t('until {{time}}', { time: item.endTime })}
                </Text>
              </View>
              <View style={styles.info}>
                <Text variant="bodyStrong">{item.name}</Text>
                {item.staffMemberName ? (
                  <Text variant="caption" tone="accent">
                    {t('with {{name}}', { name: item.staffMemberName })}
                  </Text>
                ) : null}
                {item.description ? (
                  <Text variant="caption" tone="muted">
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          </Card>
        ))
      )}
    </View>
  );
};
