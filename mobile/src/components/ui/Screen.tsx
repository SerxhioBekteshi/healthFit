import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { Text } from './Text';

interface ScreenContainerProps {
  children: React.ReactNode;
  // Sides that keep clear of the notch and the home bar. Screens under a native header only need the bottom.
  edges?: Edge[];
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    header: { gap: theme.spacing.xs, paddingTop: theme.spacing.sm },
  });

// The background and the safe area; use it directly when the content is a list.
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  edges = ['top'],
}) => {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.container} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

interface ScreenProps extends ScreenContainerProps {
  title?: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}

// A scrolling page with an optional large title and pull-to-refresh.
export const Screen: React.FC<ScreenProps> = ({
  children,
  title,
  subtitle,
  edges,
  refreshing = false,
  onRefresh,
  contentStyle,
}) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <ScreenContainer edges={edges}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            ) : undefined
          }
        >
          {title ? (
            <View style={styles.header}>
              <Text variant="title">{title}</Text>
              {subtitle ? (
                <Text variant="body" tone="muted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
