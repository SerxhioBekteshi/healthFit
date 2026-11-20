import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import type { CommunityGym } from '@gym/shared/types';

interface GymCardProps {
  gym: CommunityGym;
  onStart: (gym: CommunityGym) => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.xs },
    action: { marginTop: theme.spacing.md },
  });

// A gym a community member can look at and choose as the place to start.
export const GymCard: React.FC<GymCardProps> = ({ gym, onStart }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const place = [gym.address, gym.location].filter(Boolean).join(', ');

  return (
    <Card style={styles.stack}>
      <Text variant="heading">{gym.name}</Text>
      {place ? (
        <Text variant="body" tone="muted">
          {place}
        </Text>
      ) : null}
      <Text variant="body" tone="muted">
        {t('Open {{from}} to {{to}}', { from: gym.opensAt, to: gym.closesAt })}
      </Text>
      {gym.contactPhone ? (
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL(`tel:${gym.contactPhone.replace(/\s+/g, '')}`)
          }
        >
          <Text variant="body" tone="accent">
            {gym.contactPhone}
          </Text>
        </Pressable>
      ) : null}
      <View style={styles.action}>
        <Button
          label={t('Start here')}
          onPress={() => onStart(gym)}
          fullWidth
        />
      </View>
    </Card>
  );
};
