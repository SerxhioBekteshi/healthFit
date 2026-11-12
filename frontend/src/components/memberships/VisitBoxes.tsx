import React from 'react';
import { t } from '@/i18n';

interface VisitBoxesProps {
  total: number;
  used: number;
}

// Filled pills are visits still available; each check-in empties one.
export const VisitBoxes: React.FC<VisitBoxesProps> = ({ total, used }) => {
  const left = Math.max(total - used, 0);
  const spent = total - left;
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={t('{{left}} of {{total}} visits left', { left, total })}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-3 min-w-0 flex-1 rounded-full ${
            index < spent ? 'bg-white/10' : 'bg-signal'
          }`}
        />
      ))}
    </div>
  );
};
