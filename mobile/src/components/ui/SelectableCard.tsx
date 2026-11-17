import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface SelectableCardProps {
  title: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
    },
    body: { flex: 1, gap: 2 },
    disabled: { opacity: 0.5 },
  });

// One option of a "pick one" list, such as the way to pay.
export const SelectableCard: React.FC<SelectableCardProps> = ({
  title,
  description,
  selected,
  disabled = false,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSoft : colors.surface,
        },
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.body}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <Icon
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? 'accent' : 'textSubtle'}
      />
    </Pressable>
  );
};
