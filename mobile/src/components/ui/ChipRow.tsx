import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { Text } from './Text';

export interface ChipOption<TValue extends string | number> {
  value: TValue;
  label: string;
}

interface ChipRowProps<TValue extends string | number> {
  options: ChipOption<TValue>[];
  // `null` means no chip is selected, for filters that start unfiltered.
  value: TValue | null;
  onChange: (value: TValue) => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { gap: theme.spacing.sm, paddingRight: theme.spacing.lg },
    chip: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
    },
  });

// A horizontally scrolling row of pills where one is selected, for choices such as "3x per week".
export const ChipRow = <TValue extends string | number>({
  options,
  value,
  onChange,
}: ChipRowProps<TValue>): React.ReactElement => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.accent : colors.surface,
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              variant="caption"
              style={{
                color: selected ? colors.onAccent : colors.text,
                fontWeight: '600',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
