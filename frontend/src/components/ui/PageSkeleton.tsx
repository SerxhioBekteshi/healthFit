import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/i18n';

// Shown instantly while a page streams in, so navigation never looks frozen.
export const PageSkeleton: React.FC = () => (
  <div aria-busy="true" aria-label={t('Loading')}>
    <Skeleton className="mb-3 h-4 w-24" />
    <Skeleton className="mb-8 h-9 w-64" />
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-14" />
      ))}
    </div>
  </div>
);
