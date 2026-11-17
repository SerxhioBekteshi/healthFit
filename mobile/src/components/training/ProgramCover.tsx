import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { assetUrl } from '@/api/client';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles, type Colors, type Theme } from '@/theme';
import { workoutLevelLabels } from '@/utils/labels';
import type { WorkoutLevel } from '@gym/shared/types';

interface ProgramCoverProps {
  level: WorkoutLevel;
  // The gym's cover photo; a tinted block for the level shows when it is empty.
  imageUrl?: string;
  name?: string;
}

const levelBackground: Record<WorkoutLevel, keyof Colors> = {
  beginner: 'successSoft',
  intermediate: 'warningSoft',
  advanced: 'dangerSoft',
};

const levelColor: Record<WorkoutLevel, keyof Colors> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cover: { height: 130, justifyContent: 'center', alignItems: 'center' },
    label: {
      position: 'absolute',
      left: theme.spacing.md,
      bottom: theme.spacing.sm,
    },
  });

export const ProgramCover: React.FC<ProgramCoverProps> = ({
  level,
  imageUrl,
  name = '',
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  if (imageUrl) {
    return (
      <Image
        source={{ uri: assetUrl(imageUrl) }}
        style={styles.cover}
        contentFit="cover"
        accessibilityLabel={name || t('Program cover')}
      />
    );
  }
  return (
    <View
      style={[
        styles.cover,
        { backgroundColor: colors[levelBackground[level]] },
      ]}
    >
      <Icon name="barbell" size={44} color={levelColor[level]} />
      <Text
        variant="label"
        style={[styles.label, { color: colors[levelColor[level]] }]}
      >
        {workoutLevelLabels[level].toUpperCase()}
      </Text>
    </View>
  );
};
