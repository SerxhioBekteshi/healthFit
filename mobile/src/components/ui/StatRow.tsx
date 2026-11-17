import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';

interface StatTileProps {
  value: string | number;
  label: string;
}

interface StatRowProps {
  stats: StatTileProps[];
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', paddingVertical: theme.spacing.lg },
    tile: { flex: 1, alignItems: 'center', gap: 2 },
    divider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
  });

// Three or four numbers side by side, each with a small label.
export const StatRow: React.FC<StatRowProps> = ({ stats }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <Card padded={false} style={styles.row}>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.tile}>
            <Text variant="heading">{stat.value}</Text>
            <Text variant="label" tone="muted">
              {stat.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </Card>
  );
};
