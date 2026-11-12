import { useSyncExternalStore } from 'react';

// useSyncExternalStore keeps server and first client render identical (false), then updates.
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false
  );

export const usePrefersReducedMotion = (): boolean =>
  useMediaQuery('(prefers-reduced-motion: reduce)');
