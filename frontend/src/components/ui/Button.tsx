import React from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: IconName;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-signal text-ink hover:brightness-110',
  secondary:
    'border border-white/15 bg-white/[0.04] text-bone hover:bg-white/10',
  ghost: 'text-bone/70 hover:bg-white/10 hover:text-bone',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20',
  success:
    'border border-signal/30 bg-signal/10 text-signal hover:bg-signal/20',
  warning: 'border border-warn/30 bg-warn/10 text-warn hover:bg-warn/20',
};

const sizes = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
    {...props}
  >
    {loading ? (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : icon ? (
      <Icon name={icon} className="h-4 w-4" />
    ) : null}
    {children}
  </button>
);
