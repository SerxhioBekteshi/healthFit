import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import type { ChipOption } from './ChipRow';
import { Text } from './Text';

interface SegmentedControlProps<TValue extends string> {
  options: ChipOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.sm,
    },
  });

// Two or three views of the same screen, such as "Programs" and "Classes".
export const SegmentedControl = <TValue extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<TValue>): React.ReactElement => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected ? { backgroundColor: colors.surface } : null,
            ]}
          >
            <Text
              variant="caption"
              tone={selected ? 'default' : 'muted'}
              style={{ fontWeight: '600' }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
