import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

interface BannerProps {
  tone?: BannerTone;
  message: string;
  icon?: IconName;
}

const toneStyle = {
  info: { icon: 'information-circle', background: 'infoSoft', color: 'info' },
  success: {
    icon: 'checkmark-circle',
    background: 'successSoft',
    color: 'success',
  },
  warning: { icon: 'warning', background: 'warningSoft', color: 'warning' },
  danger: { icon: 'alert-circle', background: 'dangerSoft', color: 'danger' },
} as const;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    message: { flex: 1 },
  });

// A short message inside a screen: a hint, a warning or an error that belongs to the content.
export const Banner: React.FC<BannerProps> = ({
  tone = 'info',
  message,
  icon,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const style = toneStyle[tone];
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors[style.background] }]}
    >
      <Icon name={icon ?? style.icon} size={18} color={style.color} />
      <Text
        variant="caption"
        style={[styles.message, { color: colors[style.color] }]}
      >
        {message}
      </Text>
    </View>
  );
};
