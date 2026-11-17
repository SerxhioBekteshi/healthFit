import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '@/theme';
import { Text } from './Text';

interface AvatarProps {
  initials: string;
  size?: number;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accentSoft,
    },
  });

export const Avatar: React.FC<AvatarProps> = ({ initials, size = 64 }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text variant="heading" tone="accent" style={{ fontSize: size / 2.6 }}>
        {initials}
      </Text>
    </View>
  );
};
