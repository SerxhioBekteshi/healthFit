import React from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { t } from '@/i18n';
import type { Exercise } from '@gym/shared/types';
import { ExerciseImage } from './ExerciseImage';

interface ExerciseModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-white/[0.08] bg-ink/60 px-3 py-2 text-center">
    <dd className="text-lg font-semibold tabular-nums text-bone">{value}</dd>
    <dt className="text-xs text-bone/50">{label}</dt>
  </div>
);

// Exercise notes are stored as "Position: ..." lines; the keyword is shown in the current language.
const noteLabel = (keyword: string): string =>
  keyword === 'Position'
    ? t('Position')
    : keyword === 'Movement'
      ? t('Movement')
      : t('Tip');

// One exercise in full: picture, volume and the complete note.
export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  exercise,
  onClose,
}) => (
  <Modal
    isOpen={exercise !== null}
    title={exercise?.name ?? ''}
    onClose={onClose}
    footer={<Button onClick={onClose}>{t('Close')}</Button>}
  >
    {exercise ? (
      <div className="space-y-5">
        <ExerciseImage
          icon={exercise.icon}
          imageUrl={exercise.imageUrl}
          name={exercise.name}
          className="h-48 w-full"
        />
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={t('Sets')} value={String(exercise.sets)} />
          <Stat label={t('Reps')} value={String(exercise.reps)} />
          <Stat
            label={t('Weight')}
            value={exercise.weight > 0 ? `${exercise.weight} kg` : '—'}
          />
          <Stat
            label={t('Rest')}
            value={exercise.restSeconds > 0 ? `${exercise.restSeconds}s` : '—'}
          />
        </dl>
        {exercise.notes ? (
          <div className="space-y-2 text-sm text-bone/80">
            {exercise.notes.split('\n').map((line) => {
              const match = /^(Position|Movement|Tip): (.*)$/.exec(line);
              return match ? (
                <p key={line}>
                  <span className="font-semibold text-bone">
                    {noteLabel(match[1])}:{' '}
                  </span>
                  {match[2]}
                </p>
              ) : (
                <p key={line}>{line}</p>
              );
            })}
          </div>
        ) : null}
      </div>
    ) : null}
  </Modal>
);
