import { useState } from 'react';

type Refetch = () => Promise<unknown>;

// Pull-to-refresh for a screen that shows several queries: pass each `refetch`.
export const useRefresh = (...refetches: Refetch[]) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all(refetches.map((refetch) => refetch()));
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
};
