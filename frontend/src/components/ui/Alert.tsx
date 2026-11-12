import React from 'react';
import { Icon } from '@/components/ui/Icon';

export type AlertTone = 'error' | 'success' | 'info' | 'warning';

const tones: Record<AlertTone, string> = {
  error: 'border-danger/25 bg-danger/10 text-danger',
  success: 'border-signal/25 bg-signal/10 text-signal',
  info: 'border-info/25 bg-info/10 text-info',
  warning: 'border-warn/25 bg-warn/10 text-warn',
};

interface AlertProps {
  tone?: AlertTone;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  tone = 'error',
  children,
  className = '',
}) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${tones[tone]} ${className}`}
  >
    <Icon
      name={tone === 'success' ? 'check' : 'alert'}
      className="mt-0.5 h-4 w-4 shrink-0"
    />
    <div>{children}</div>
  </div>
);
