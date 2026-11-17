import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useThemedStyles, type Theme } from '@/theme';
import { initials } from '@/utils/format';
import type { User } from '@gym/shared/types';

interface ProfileHeaderProps {
  user: User;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
    },
    name: { marginTop: theme.spacing.sm },
  });

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Avatar initials={initials(user.fullName)} />
      <Text variant="title" style={styles.name}>
        {user.fullName}
      </Text>
      <Text variant="body" tone="muted">
        {user.email}
      </Text>
    </View>
  );
};
