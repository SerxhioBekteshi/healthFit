import React from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const tones: Record<BadgeTone, string> = {
  success: 'bg-signal/10 text-signal ring-signal/20',
  warning: 'bg-warn/10 text-warn ring-warn/20',
  danger: 'bg-danger/10 text-danger ring-danger/20',
  neutral: 'bg-white/[0.06] text-bone/60 ring-white/10',
  info: 'bg-info/10 text-info ring-info/20',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  children,
  dot = true,
}) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
  >
    {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
    {children}
  </span>
);
