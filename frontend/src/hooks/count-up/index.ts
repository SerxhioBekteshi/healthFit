import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Counts from the previous value to `target`, so a refetch animates the change.
export const useCountUp = (target: number, duration = 900): number => {
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      shown.current = target;
      setValue(target);
      return;
    }
    const from = shown.current;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number): void => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      shown.current = from + (target - from) * eased;
      setValue(shown.current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
};
