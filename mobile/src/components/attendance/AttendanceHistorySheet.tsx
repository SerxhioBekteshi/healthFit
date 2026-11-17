import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LoadingView } from '@/components/ui/LoadingView';
import { MonthCalendar } from '@/components/ui/MonthCalendar';
import { MonthNav } from '@/components/ui/MonthNav';
import { Text } from '@/components/ui/Text';
import { useAttendanceDays } from '@/hooks/attendance';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { monthOf } from '@gym/shared/calendar';

interface AttendanceHistorySheetProps {
  visible: boolean;
  // Today in the gym's calendar (YYYY-MM-DD); the calendar opens on its month and cannot go past it.
  today: string;
  onClose: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    summary: {
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
  });

// The days the member has been to the gym, month by month. It only shows; nothing is picked.
export const AttendanceHistorySheet: React.FC<AttendanceHistorySheetProps> = ({
  visible,
  today,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const currentMonth = monthOf(today);
  const [month, setMonth] = useState(currentMonth);
  const { data, isPending, error } = useAttendanceDays(month, visible);
  const count = data?.days.length ?? 0;

  const close = (): void => {
    setMonth(currentMonth);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      title={t('Check-in history')}
      description={t('Days you checked in are highlighted.')}
      onClose={close}
      cancelLabel={t('Close')}
    >
      <MonthNav month={month} onChange={setMonth} maxMonth={currentMonth} />

      {error ? <Banner tone="danger" message={error.message} /> : null}
      {isPending && !error ? <LoadingView /> : null}
      {data ? (
        <>
          <MonthCalendar
            month={month}
            today={today}
            markedDates={data.days}
            markedLabel={t('checked in')}
          />
          <View style={styles.summary}>
            <Text variant="caption" tone="muted" align="center">
              {count === 1
                ? t('1 day with a check-in')
                : t('{{n}} days with a check-in', { n: count })}
            </Text>
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
};
