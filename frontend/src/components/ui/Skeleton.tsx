import React from 'react';
import { t } from '@/i18n';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    aria-hidden
    className={`animate-pulse rounded-2xl bg-white/[0.05] ${className}`}
  />
);

interface StatGridSkeletonProps {
  count?: number;
}

export const StatGridSkeleton: React.FC<StatGridSkeletonProps> = ({
  count = 4,
}) => (
  <div
    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    aria-busy="true"
    aria-label={t('Loading')}
  >
    {Array.from({ length: count }, (_, index) => (
      <Skeleton key={index} className="h-[7.5rem]" />
    ))}
  </div>
);
