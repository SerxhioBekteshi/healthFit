import React from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: IconName;
  // Highlights the figure in the accent colour.
  accent?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  icon,
  accent = false,
}) => (
  <article className="rounded-xl border border-white/10 bg-panel p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-bone/55">{label}</p>
      {icon ? (
        <span className="text-bone/30">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      ) : null}
    </div>
    <p
      className={`mt-3 text-3xl font-semibold leading-none tracking-tight tabular-nums ${
        accent ? 'text-signal' : 'text-bone'
      }`}
    >
      {value}
    </p>
    {hint ? <p className="mt-2.5 text-xs text-bone/45">{hint}</p> : null}
  </article>
);
