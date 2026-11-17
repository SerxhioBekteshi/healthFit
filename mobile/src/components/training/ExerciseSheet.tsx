import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import type { Exercise } from '@gym/shared/types';
import { ExerciseImage } from './ExerciseImage';

interface ExerciseSheetProps {
  // The exercise to show; null keeps the sheet closed.
  exercise: Exercise | null;
  onClose: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.lg },
    stats: { flexDirection: 'row', gap: theme.spacing.sm },
    stat: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    notes: { gap: theme.spacing.sm },
  });

// Exercise notes are stored as "Position: ..." lines; the keyword is shown in the current language.
const NOTE_LINE = /^(Position|Movement|Tip): (.*)$/;

// One exercise in full: picture, volume and the complete note.
export const ExerciseSheet: React.FC<ExerciseSheetProps> = ({
  exercise,
  onClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const noteLabel = (keyword: string): string =>
    keyword === 'Position'
      ? t('Position')
      : keyword === 'Movement'
        ? t('Movement')
        : t('Tip');

  const stats = exercise
    ? [
        { label: t('Sets'), value: String(exercise.sets) },
        { label: t('Reps'), value: String(exercise.reps) },
        {
          label: t('Weight'),
          value: exercise.weight > 0 ? `${exercise.weight} kg` : '—',
        },
        {
          label: t('Rest'),
          value: exercise.restSeconds > 0 ? `${exercise.restSeconds}s` : '—',
        },
      ]
    : [];

  return (
    <BottomSheet
      visible={exercise !== null}
      title={exercise?.name ?? ''}
      onClose={onClose}
      cancelLabel={t('Close')}
    >
      {exercise ? (
        <View style={styles.stack}>
          <ExerciseImage
            icon={exercise.icon}
            imageUrl={exercise.imageUrl}
            name={exercise.name}
            width="100%"
            height={190}
          />
          <View style={styles.stats}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <Text variant="heading">{stat.value}</Text>
                <Text variant="label" tone="muted">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
          {exercise.notes ? (
            <View style={styles.notes}>
              {exercise.notes.split('\n').map((line) => {
                const match = NOTE_LINE.exec(line);
                return match ? (
                  <Text key={line} variant="body" tone="muted">
                    <Text variant="bodyStrong">{noteLabel(match[1])}: </Text>
                    {match[2]}
                  </Text>
                ) : (
                  <Text key={line} variant="body" tone="muted">
                    {line}
                  </Text>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </BottomSheet>
  );
};
