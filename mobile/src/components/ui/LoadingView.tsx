import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

interface LoadingViewProps {
  // Fills the screen; otherwise it only takes the room of the spinner.
  fill?: boolean;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ fill = false }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('Loading')}
      style={[styles.wrap, fill ? styles.fill : null]}
    >
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  fill: { flex: 1 },
});
