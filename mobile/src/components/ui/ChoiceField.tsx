import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '@/theme';
import { ChipRow, type ChipOption } from './ChipRow';
import { Text } from './Text';

interface ChoiceFieldProps<TValue extends string> {
  label: string;
  options: ChipOption<TValue>[];
  value: TValue | null;
  onChange: (value: TValue) => void;
  error?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({ field: { gap: theme.spacing.xs } });

// A labelled "pick one" row of chips for a form field such as gender or country.
export const ChoiceField = <TValue extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: ChoiceFieldProps<TValue>): React.ReactElement => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.field}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <ChipRow options={options} value={value} onChange={onChange} />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
};
