import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { formatDay, localToday } from '@/utils/format';
import { monthOf } from '@gym/shared/calendar';
import { Button } from './Button';
import { Icon } from './Icon';
import { MonthCalendar } from './MonthCalendar';
import { MonthNav } from './MonthNav';
import { Text } from './Text';

interface DateFieldProps {
  label: string;
  // YYYY-MM-DD, or undefined when no date is set.
  value: string | undefined;
  onChange: (date: string | undefined) => void;
  // Whether the calendar under the field is open; the parent keeps only one open at a time.
  open: boolean;
  onToggle: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { gap: theme.spacing.xs },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      minHeight: 48,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
    },
    value: { flexShrink: 1 },
    calendar: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });

// A date shown as text; tapping it opens a calendar to pick the day (or clear it). Nothing is typed.
export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  open,
  onToggle,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const today = localToday();
  const [month, setMonth] = useState(monthOf(value ?? today));

  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={[
          styles.field,
          { borderColor: open ? colors.accent : colors.border },
        ]}
      >
        <Text
          variant="body"
          tone={value ? 'default' : 'subtle'}
          style={styles.value}
        >
          {value ? formatDay(value) : t('Any')}
        </Text>
        <Icon name="calendar-outline" size={20} />
      </Pressable>
      {open ? (
        <View style={styles.calendar}>
          <MonthNav month={month} onChange={setMonth} />
          <MonthCalendar
            month={month}
            today={today}
            selected={value ?? null}
            onSelect={(date) => {
              onChange(date);
              onToggle();
            }}
          />
          {value ? (
            <Button
              label={t('Clear')}
              size="sm"
              variant="ghost"
              onPress={() => {
                onChange(undefined);
                onToggle();
              }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
