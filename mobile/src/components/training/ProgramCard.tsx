import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { workoutLevelLabels, workoutLevelTone } from '@/utils/labels';
import type { Exercise, WorkoutProgram } from '@gym/shared/types';
import { ExerciseImage } from './ExerciseImage';
import { ExerciseSheet } from './ExerciseSheet';
import { ProgramCover } from './ProgramCover';

interface ProgramCardProps {
  program: WorkoutProgram;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { overflow: 'hidden' },
    body: { padding: theme.spacing.lg, gap: theme.spacing.sm },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    title: { flex: 1 },
    days: { gap: theme.spacing.md, marginTop: theme.spacing.sm },
    day: {
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.background,
    },
    exercise: { flexDirection: 'row', gap: theme.spacing.md },
    exerciseInfo: { flex: 1, gap: 2 },
    link: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  });

const describeExercise = (
  exercise: Exercise,
  t: (text: string, values?: Record<string, string | number>) => string
): string =>
  [
    `${exercise.sets}×${exercise.reps}`,
    exercise.weight > 0
      ? t('@ {{weight}}kg', { weight: exercise.weight })
      : null,
    exercise.restSeconds > 0
      ? t('{{n}}s rest', { n: exercise.restSeconds })
      : null,
  ]
    .filter(Boolean)
    .join(', ');

// A workout programme from the gym: its days and exercises; "View full exercise" opens the details.
export const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [viewing, setViewing] = useState<Exercise | null>(null);

  return (
    <Card padded={false} style={styles.card}>
      <ProgramCover
        level={program.level}
        imageUrl={program.imageUrl}
        name={program.name}
      />
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.title}>
            <Text variant="heading">{program.name}</Text>
            <Text variant="caption" tone="muted">
              {t('{{n}} sessions / week', { n: program.sessionsPerWeek })}
            </Text>
          </View>
          <Badge
            label={workoutLevelLabels[program.level]}
            tone={workoutLevelTone[program.level]}
          />
        </View>
        {program.description ? (
          <Text variant="body" tone="muted">
            {program.description}
          </Text>
        ) : null}

        <View style={styles.days}>
          {program.days.map((day) => (
            <View key={day.id} style={styles.day}>
              <View>
                <Text variant="label" tone="accent">
                  {t('Day {{n}}', { n: day.dayNumber })}
                </Text>
                <Text variant="bodyStrong">{day.focus}</Text>
              </View>
              {day.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exercise}>
                  <ExerciseImage
                    icon={exercise.icon}
                    imageUrl={exercise.imageUrl}
                    name={exercise.name}
                  />
                  <View style={styles.exerciseInfo}>
                    <Text variant="bodyStrong">{exercise.name}</Text>
                    <Text variant="caption" tone="muted">
                      {describeExercise(exercise, t)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setViewing(exercise)}
                      style={styles.link}
                    >
                      <Text variant="caption" tone="accent">
                        {t('View full exercise')}
                      </Text>
                      <Icon name="chevron-forward" size={14} color="accent" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
      <ExerciseSheet exercise={viewing} onClose={() => setViewing(null)} />
    </Card>
  );
};
