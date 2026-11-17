import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { mapUrl } from '@/utils/maps';
import type { GymLocation } from '@gym/shared/types';

interface LocationCardProps {
  location: GymLocation;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.xs },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
  });

// A gym location with one tap to call it or to get directions.
export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const directions = mapUrl(location);

  return (
    <Card style={styles.stack}>
      <Text variant="heading">{location.name}</Text>
      <Text variant="body" tone="muted">
        {location.address}
      </Text>
      <View style={styles.actions}>
        {directions ? (
          <Button
            label={t('Directions')}
            icon="navigate-outline"
            size="sm"
            variant="secondary"
            onPress={() => void Linking.openURL(directions)}
          />
        ) : null}
        {location.phone ? (
          <Button
            label={t('Call')}
            icon="call-outline"
            size="sm"
            variant="secondary"
            onPress={() =>
              void Linking.openURL(`tel:${location.phone.replace(/\s/g, '')}`)
            }
          />
        ) : null}
      </View>
    </Card>
  );
};
