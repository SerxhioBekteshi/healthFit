import React from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { assetUrl } from '@/api/client';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles, type Theme } from '@/theme';
import { getExerciseIcon } from '@/utils/exercise-icons';

interface ExerciseImageProps {
  // The movement key stored by the backend; the figure for it shows when there is no photo.
  icon: string;
  // The gym's own photo, shown instead of the figure when set.
  imageUrl?: string;
  name?: string;
  width?: DimensionValue;
  height?: number;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    frame: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accentSoft,
    },
    fill: { width: '100%', height: '100%' },
  });

// The photo of the gym if it uploaded one, otherwise a figure of the movement.
export const ExerciseImage: React.FC<ExerciseImageProps> = ({
  icon,
  imageUrl,
  name = '',
  width = 44,
  height = 44,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  // The label of the figure is translated when read, so redraw when the language changes.
  useTranslation();
  const { figure, label } = getExerciseIcon(icon);

  return (
    <View style={[styles.frame, { width, height }]}>
      {imageUrl ? (
        <Image
          source={{ uri: assetUrl(imageUrl) }}
          style={styles.fill}
          contentFit="cover"
          accessibilityLabel={name || label}
        />
      ) : (
        <Svg
          viewBox="0 0 64 64"
          accessibilityLabel={label}
          style={styles.fill}
          fill="none"
        >
          {figure.gear ? (
            <Path
              d={figure.gear}
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.45}
            />
          ) : null}
          <Circle
            cx={figure.head[0]}
            cy={figure.head[1]}
            r={5}
            stroke={colors.accent}
            strokeWidth={3}
          />
          <Path
            d={figure.body}
            stroke={colors.accent}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
};
