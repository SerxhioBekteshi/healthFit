import React from 'react';
import { assetUrl } from '@/services/api';
import { getExerciseIcon } from '@/utils/constants/exercise-icons';

interface ExerciseImageProps {
  icon: string;
  // Uploaded photo; the figure for `icon` shows when it is empty.
  imageUrl?: string;
  name?: string;
  className?: string;
}

// The photo of the gym if it uploaded one, otherwise a figure of the movement.
export const ExerciseImage: React.FC<ExerciseImageProps> = ({
  icon,
  imageUrl,
  name = '',
  className = 'h-12 w-12',
}) => {
  const { figure, label } = getExerciseIcon(icon);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06] ${className}`}
    >
      {imageUrl ? (
        <img
          src={assetUrl(imageUrl)}
          alt={name || label}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 64 64"
          role="img"
          aria-label={label}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full p-1 text-signal"
        >
          {figure.gear ? (
            <path
              d={figure.gear}
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.45"
            />
          ) : null}
          <circle
            cx={figure.head[0]}
            cy={figure.head[1]}
            r="5"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path d={figure.body} stroke="currentColor" strokeWidth="3.5" />
        </svg>
      )}
    </span>
  );
};
