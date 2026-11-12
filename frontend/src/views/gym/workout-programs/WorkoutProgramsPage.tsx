import React, { useMemo, useState } from 'react';
import { WorkoutProgramCard } from '@/components/workout-programs/WorkoutProgramCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWorkoutPrograms } from '@/hooks/workout-programs';
import { t } from '@/i18n';
import type { WorkoutLevel, WorkoutProgram } from '@gym/shared/types';
import {
  workoutLevelLabels,
  workoutLevels,
} from '@/utils/constants/workout-levels';
import type { WorkoutProgramInput } from '@gym/shared/validation/workout-programs';
import { WorkoutProgramFormDrawer } from './WorkoutProgramFormDrawer';

export const WorkoutProgramsPage: React.FC = () => {
  const {
    programs,
    isLoading,
    error,
    createProgram,
    updateProgram,
    deleteProgram,
  } = useWorkoutPrograms();
  const [activeLevel, setActiveLevel] = useState<WorkoutLevel>('beginner');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WorkoutProgram | null>(null);
  const [deleting, setDeleting] = useState<WorkoutProgram | null>(null);

  const programsByLevel = useMemo(() => {
    const groups: Record<WorkoutLevel, WorkoutProgram[]> = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };
    for (const program of programs) {
      groups[program.level].push(program);
    }
    return groups;
  }, [programs]);

  const saveMutation = editing ? updateProgram : createProgram;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (program: WorkoutProgram | null): void => {
    createProgram.reset();
    updateProgram.reset();
    setEditing(program);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: WorkoutProgramInput): Promise<void> => {
    try {
      if (editing) {
        await updateProgram.mutateAsync({
          programId: editing.id,
          input: values,
        });
      } else {
        await createProgram.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const onDelete = (): void => {
    if (deleting) deleteProgram.mutate(deleting.id);
    setDeleting(null);
  };

  const visible = programsByLevel[activeLevel];

  return (
    <>
      <PageHeader
        eyebrow={t('Operations')}
        title={t('Workout')}
        accent={t('programs')}
        description={t('Weekly plans for your members, organized by level.')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Create {{level}} program', {
              level: workoutLevelLabels[activeLevel],
            })}
          </Button>
        }
      />

      <div className="mb-6">
        <Segmented
          label={t('Program level')}
          value={activeLevel}
          onChange={setActiveLevel}
          options={workoutLevels.map((level) => ({
            value: level,
            label: workoutLevelLabels[level],
            count: programsByLevel[level].length,
          }))}
        />
      </div>

      {error ? <Alert>{error.message}</Alert> : null}
      {deleteProgram.error ? (
        <Alert className="mb-4">{deleteProgram.error.message}</Alert>
      ) : null}

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-4">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
              <p className="text-sm font-semibold text-bone">
                {t('No {{level}} programs yet', {
                  level: workoutLevelLabels[activeLevel].toLowerCase(),
                })}
              </p>
              <p className="mt-1 text-sm text-bone/50">
                {t('Create one to get started.')}
              </p>
            </div>
          ) : null}
          {visible.map((program) => (
            <WorkoutProgramCard
              key={program.id}
              program={program}
              actions={
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="pencil"
                    onClick={() => openDrawer(program)}
                  >
                    {t('Edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon="trash"
                    disabled={deleteProgram.isPending}
                    onClick={() => setDeleting(program)}
                  >
                    {t('Delete')}
                  </Button>
                </>
              }
            />
          ))}
        </div>
      ) : null}

      <WorkoutProgramFormDrawer
        isOpen={isDrawerOpen}
        program={editing}
        defaultLevel={activeLevel}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      <Modal
        isOpen={deleting !== null}
        size="sm"
        title={t('Delete program')}
        description={
          deleting
            ? t('Delete the program "{{name}}"?', { name: deleting.name })
            : undefined
        }
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t('Cancel')}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              {t('Delete')}
            </Button>
          </>
        }
      />
    </>
  );
};
