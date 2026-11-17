import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { formatMonth } from '@/utils/format';
import { shiftMonth } from '@gym/shared/calendar';
import { Icon } from './Icon';
import { Text } from './Text';

interface MonthNavProps {
  // The month shown, YYYY-MM.
  month: string;
  onChange: (month: string) => void;
  // The last month that can be opened; the "next" arrow is off from there.
  maxMonth?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    arrow: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
    },
    disabled: { opacity: 0.3 },
    // The month name is the only part that grows with the language: it wraps instead of overflowing.
    month: { flex: 1 },
  });

// "<  November 2026  >" above a calendar.
export const MonthNav: React.FC<MonthNavProps> = ({
  month,
  onChange,
  maxMonth,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const atEnd = maxMonth !== undefined && month >= maxMonth;

  return (
    <View style={styles.nav}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Previous month')}
        onPress={() => onChange(shiftMonth(month, -1))}
        style={styles.arrow}
      >
        <Icon name="chevron-back" size={22} />
      </Pressable>
      <Text
        variant="bodyStrong"
        align="center"
        style={styles.month}
        accessibilityRole="header"
      >
        {formatMonth(month)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Next month')}
        accessibilityState={{ disabled: atEnd }}
        disabled={atEnd}
        onPress={() => onChange(shiftMonth(month, 1))}
        style={[styles.arrow, atEnd ? styles.disabled : null]}
      >
        <Icon name="chevron-forward" size={22} />
      </Pressable>
    </View>
  );
};
