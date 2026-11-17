import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { useThemedStyles, type Theme } from '@/theme';

interface CardProps extends ViewProps {
  // Makes the whole card tappable.
  onPress?: () => void;
  padded?: boolean;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    padded: { padding: theme.spacing.lg },
    pressed: { opacity: 0.85 },
  });

export const Card: React.FC<CardProps> = ({
  onPress,
  padded = true,
  style,
  children,
  ...props
}) => {
  const styles = useThemedStyles(createStyles);
  const cardStyle = [styles.card, padded ? styles.padded : null, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View {...props} style={cardStyle}>
      {children}
    </View>
  );
};
