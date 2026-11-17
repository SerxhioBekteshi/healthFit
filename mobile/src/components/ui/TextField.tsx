import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  // Shown inside the field on the right, for example a card brand.
  accessory?: React.ReactNode;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: { gap: theme.spacing.xs },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
    },
    input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  });

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  hint,
  accessory,
  ...inputProps
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          { borderColor: error ? colors.danger : colors.border },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.accent}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
          style={[styles.input, { color: colors.text }]}
        />
        {accessory}
      </View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
};
