import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { formatDuration, formatShortDate, formatTime } from '@/utils/format';
import type { AttendanceRecord } from '@gym/shared/types';

interface VisitRowProps {
  record: AttendanceRecord;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    info: { flex: 1, gap: 2 },
  });

// One visit: the day, when the member came in and left, where and which locker.
export const VisitRow: React.FC<VisitRowProps> = ({ record }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const details = [
    record.locationName,
    record.lockerNumber
      ? t('Locker {{number}}', { number: record.lockerNumber })
      : null,
  ].filter(Boolean);

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="bodyStrong">
            {formatShortDate(record.checkedInAt)}
          </Text>
          <Text variant="caption" tone="muted">
            {formatTime(record.checkedInAt)}
            {record.checkedOutAt
              ? ` - ${formatTime(record.checkedOutAt)} · ${formatDuration(record.checkedInAt, record.checkedOutAt)}`
              : ''}
          </Text>
          {details.length > 0 ? (
            <Text variant="caption" tone="subtle">
              {details.join(' · ')}
            </Text>
          ) : null}
        </View>
        {record.checkedOutAt ? null : (
          <Badge label={t('Inside')} tone="success" />
        )}
      </View>
    </Card>
  );
};
