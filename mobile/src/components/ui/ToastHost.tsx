import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, type Colors, type Theme } from '@/theme';
import { toast, type ToastKind, type ToastMessage } from '@/utils/toast';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const VISIBLE_MS = 3500;
const OFFSET_FROM_TOP = 8;

const kindStyle: Record<ToastKind, { icon: IconName; color: keyof Colors }> = {
  success: { icon: 'checkmark-circle', color: 'success' },
  error: { icon: 'alert-circle', color: 'danger' },
  info: { icon: 'information-circle', color: 'info' },
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      zIndex: 1000,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    message: { flex: 1 },
  });

// Shows the result of an action for a few seconds. Put one in the root layout and one inside every modal.
export const ToastHost: React.FC = () => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));
  const [current, setCurrent] = useState<ToastMessage | null>(null);

  useEffect(() => toast.register(setCurrent), []);

  useEffect(() => {
    if (!current) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setCurrent(null);
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [current, opacity]);

  if (!current) return null;
  const style = kindStyle[current.kind];

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { top: insets.top + OFFSET_FROM_TOP }]}
    >
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[styles.toast, { borderColor: colors[style.color], opacity }]}
      >
        <Icon name={style.icon} size={20} color={style.color} />
        <Text variant="caption" style={styles.message}>
          {current.message}
        </Text>
      </Animated.View>
    </View>
  );
};
