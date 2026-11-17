import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { ErrorState } from './EmptyState';
import { LoadingView } from './LoadingView';

interface QueryBoundaryProps<T> {
  query: Pick<
    UseQueryResult<T, Error>,
    'data' | 'isPending' | 'error' | 'refetch'
  >;
  children: (data: T) => React.ReactNode;
}

// Shows a spinner while loading, an error with "Try again" on failure, and the content otherwise.
// Data already on screen stays visible while it refreshes.
export const QueryBoundary = <T,>({
  query,
  children,
}: QueryBoundaryProps<T>): React.ReactElement => {
  const { t } = useTranslation();
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.isPending) return <LoadingView />;
  return (
    <ErrorState
      message={query.error?.message ?? t('Please try again.')}
      onRetry={() => void query.refetch()}
    />
  );
};
