import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Colors, type Theme } from '@/theme';
import { Text } from './Text';

export type BadgeTone =
  'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const toneColors = (
  colors: Colors,
  tone: BadgeTone
): { background: string; text: string } => {
  switch (tone) {
    case 'success':
      return { background: colors.successSoft, text: colors.success };
    case 'warning':
      return { background: colors.warningSoft, text: colors.warning };
    case 'danger':
      return { background: colors.dangerSoft, text: colors.danger };
    case 'info':
      return { background: colors.infoSoft, text: colors.info };
    case 'accent':
      return { background: colors.accentSoft, text: colors.accent };
    default:
      return { background: colors.surfaceMuted, text: colors.textMuted };
  }
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
    },
  });

export const Badge: React.FC<BadgeProps> = ({ label, tone = 'neutral' }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const palette = toneColors(colors, tone);
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text variant="label" style={{ color: palette.text }}>
        {label}
      </Text>
    </View>
  );
};
