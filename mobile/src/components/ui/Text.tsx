import React from 'react';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';
import { useTheme, type Colors, type TextVariant } from '@/theme';

export type TextTone =
  'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'onAccent';

const toneColor = (colors: Colors, tone: TextTone): string => {
  switch (tone) {
    case 'muted':
      return colors.textMuted;
    case 'subtle':
      return colors.textSubtle;
    case 'accent':
      return colors.accent;
    case 'danger':
      return colors.danger;
    case 'success':
      return colors.success;
    case 'onAccent':
      return colors.onAccent;
    default:
      return colors.text;
  }
};

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
}

// Every piece of text goes through here so size, weight and colour stay consistent.
export const Text: React.FC<AppTextProps> = ({
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...props
}) => {
  const { colors, typography } = useTheme();
  return (
    <NativeText
      {...props}
      style={[
        typography[variant],
        variant === 'mono' ? styles.mono : null,
        { color: toneColor(colors, tone), textAlign: align },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  mono: { fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
});
