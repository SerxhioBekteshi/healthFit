import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '@/theme';
import { Text } from './Text';

interface SectionHeaderProps {
  title: string;
  // Small text on the right, for example a count.
  trailing?: string;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: theme.spacing.sm,
    },
  });

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  trailing,
}) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text variant="heading">{title}</Text>
      {trailing ? (
        <Text variant="caption" tone="muted">
          {trailing}
        </Text>
      ) : null}
    </View>
  );
};
