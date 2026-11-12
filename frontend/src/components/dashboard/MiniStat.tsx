import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui/Icon';
import { AnimatedNumber } from './AnimatedNumber';

interface MiniStatProps {
  icon: IconName;
  label: string;
  value: number;
  format?: (value: number) => string;
  hint?: string;
  // Highlights the figure in the accent colour.
  accent?: boolean;
  // Pulsing dot for numbers that are live.
  live?: boolean;
  to?: string;
  // Staggers the entrance animation.
  index?: number;
}

// A small KPI tile: the figure counts up when it first appears.
export const MiniStat: React.FC<MiniStatProps> = ({
  icon,
  label,
  value,
  format,
  hint,
  accent = false,
  live = false,
  to,
  index = 0,
}) => {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-bone/55">{label}</p>
        {live && value > 0 ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
        ) : (
          <Icon name={icon} className="h-3.5 w-3.5 text-bone/30" />
        )}
      </div>
      <p
        className={`mt-1.5 text-2xl font-semibold leading-none tracking-tight ${
          accent ? 'text-signal' : 'text-bone'
        }`}
      >
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint ? (
        <p className="mt-1.5 truncate text-[11px] text-bone/40">{hint}</p>
      ) : null}
    </>
  );
  const className =
    'block rounded-xl border border-white/10 bg-panel px-4 py-3 shadow-sm motion-safe:animate-fade-up';
  const style = { animationDelay: `${index * 60}ms` };

  return to ? (
    <Link
      to={to}
      style={style}
      className={`${className} transition-colors hover:border-white/25`}
    >
      {body}
    </Link>
  ) : (
    <div style={style} className={className}>
      {body}
    </div>
  );
};
