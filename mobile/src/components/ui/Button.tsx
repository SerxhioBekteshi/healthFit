import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles, useTheme, type Theme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
    },
    md: { minHeight: 48, paddingHorizontal: theme.spacing.xl },
    sm: { minHeight: 36, paddingHorizontal: theme.spacing.lg },
    fullWidth: { alignSelf: 'stretch' },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.8 },
  });

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const palette = {
    primary: {
      background: colors.accent,
      border: colors.accent,
      text: colors.onAccent,
    },
    secondary: {
      background: colors.surface,
      border: colors.border,
      text: colors.text,
    },
    ghost: {
      background: 'transparent',
      border: 'transparent',
      text: colors.accent,
    },
    danger: {
      background: colors.dangerSoft,
      border: colors.dangerSoft,
      text: colors.danger,
    },
  }[variant];

  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        { backgroundColor: palette.background, borderColor: palette.border },
        fullWidth ? styles.fullWidth : null,
        inactive ? styles.disabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : icon ? (
        <View>
          <Icon
            name={icon}
            size={size === 'sm' ? 16 : 20}
            color={
              variant === 'primary'
                ? 'onAccent'
                : variant === 'danger'
                  ? 'danger'
                  : 'accent'
            }
          />
        </View>
      ) : null}
      <Text
        variant={size === 'sm' ? 'caption' : 'bodyStrong'}
        style={{ color: palette.text, fontWeight: '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
};
