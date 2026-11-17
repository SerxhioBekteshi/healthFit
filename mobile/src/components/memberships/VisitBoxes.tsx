import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles, type Theme } from '@/theme';

interface VisitBoxesProps {
  // Visits the plan allows in the period.
  total: number;
  // Visits already used; the rest stay filled.
  used: number;
}

const BOX_SIZE = 16;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    box: {
      width: BOX_SIZE,
      height: BOX_SIZE,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
  });

// One box per allowed visit; the boxes still to use are filled.
export const VisitBoxes: React.FC<VisitBoxesProps> = ({ total, used }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const remaining = Math.max(total - used, 0);
  return (
    <View
      accessible
      accessibilityLabel={t('{{n}} of {{total}} visits left', {
        n: remaining,
        total,
      })}
      style={styles.wrap}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.box,
            index < remaining
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : null,
          ]}
        />
      ))}
    </View>
  );
};
