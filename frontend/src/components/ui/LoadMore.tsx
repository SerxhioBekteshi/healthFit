import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/i18n';

interface LoadMoreProps {
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreFailed: boolean;
  onLoadMore: () => void;
  // Changes after every page so a still-visible end triggers the next load.
  itemCount: number;
  className?: string;
}

// Footer of a scrolling list: loads the next page when it comes into view.
export const LoadMore: React.FC<LoadMoreProps> = ({
  hasMore,
  isLoadingMore,
  loadMoreFailed,
  onLoadMore,
  itemCount,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMore || isLoadingMore || loadMoreFailed) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreFailed, onLoadMore, itemCount]);

  if (!hasMore) {
    return null;
  }

  return (
    <div ref={ref} className={className}>
      {loadMoreFailed ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-bone/55">{t('Could not load more.')}</p>
          <Button size="sm" variant="secondary" onClick={onLoadMore}>
            {t('Try again')}
          </Button>
        </div>
      ) : (
        <Skeleton className="h-14" />
      )}
    </div>
  );
};
