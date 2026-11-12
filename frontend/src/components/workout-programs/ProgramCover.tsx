import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { assetUrl } from '@/services/api';
import { t } from '@/i18n';
import { workoutLevelLabels } from '@/utils/constants/workout-levels';
import type { WorkoutLevel } from '@gym/shared/types';

interface ProgramCoverProps {
  level: WorkoutLevel;
  // Uploaded cover photo; a gradient for the level shows when it is empty.
  imageUrl?: string;
  name?: string;
  className?: string;
}

const gradients: Record<WorkoutLevel, string> = {
  beginner: 'from-signal/30 via-signal/10 to-transparent',
  intermediate: 'from-warn/30 via-warn/10 to-transparent',
  advanced: 'from-danger/30 via-danger/10 to-transparent',
};

export const ProgramCover: React.FC<ProgramCoverProps> = ({
  level,
  imageUrl,
  name = '',
  className = 'h-32 w-full',
}) => (
  <div
    className={`relative overflow-hidden rounded-lg bg-white/[0.06] ${className}`}
  >
    {imageUrl ? (
      <img
        src={assetUrl(imageUrl)}
        alt={name || t('Program cover')}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    ) : (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradients[level]}`}
      >
        <Icon name="dumbbell" className="h-10 w-10 text-bone/40" />
        <span className="absolute bottom-2 left-3 text-xs font-medium uppercase tracking-wide text-bone/50">
          {workoutLevelLabels[level]}
        </span>
      </div>
    )}
  </div>
);
