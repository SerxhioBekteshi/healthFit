import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-8 w-8 text-[0.65rem]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
};

export const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md' }) => (
  <span
    className={`grid shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-white/15 to-white/[0.03] font-bold tracking-wide text-bone ${sizes[size]}`}
    aria-hidden
  >
    {initialsOf(name)}
  </span>
);
