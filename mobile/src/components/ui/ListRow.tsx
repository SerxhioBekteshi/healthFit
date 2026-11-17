import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  // Text or any element shown on the right, before the chevron.
  trailing?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 56,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.accentSoft,
    },
    body: { flex: 1, gap: 2 },
    pressed: { backgroundColor: theme.colors.surfaceMuted },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: theme.spacing.lg,
      backgroundColor: theme.colors.border,
    },
  });

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  destructive = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            destructive ? { backgroundColor: colors.dangerSoft } : null,
          ]}
        >
          <Icon
            name={icon}
            size={20}
            color={destructive ? 'danger' : 'accent'}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="bodyStrong" tone={destructive ? 'danger' : 'default'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress && !destructive ? (
        <Icon name="chevron-forward" size={18} color="textSubtle" />
      ) : null}
    </Pressable>
  );
};

// Rows in one card with a thin line between them, like the settings of a phone.
export const ListGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const styles = useThemedStyles(createStyles);
  const rows = React.Children.toArray(children);
  return (
    <Card padded={false}>
      {rows.map((row, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {row}
        </React.Fragment>
      ))}
    </Card>
  );
};
