import { useEffect, useState } from 'react';

const secondsUntil = (isoTime: string, now: number): number =>
  Math.max(Math.floor((new Date(isoTime).getTime() - now) / 1000), 0);

// Seconds left until a moment in time, updated every second; 0 when there is none.
export const useSecondsLeft = (isoTime: string | undefined): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isoTime) return;
    const tick = (): void => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [isoTime]);

  return isoTime ? secondsUntil(isoTime, now) : 0;
};

// 95 -> "1:35"
export const formatClock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
