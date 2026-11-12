import { useEffect, useState } from 'react';

// Follows `value` after it has stopped changing for `delay` ms, e.g. to wait for typing to pause.
export const useDebouncedValue = <T>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
