import React from 'react';

interface BrandMarkProps {
  className?: string;
}

// HealthFIT logo: a heart with a heartbeat line.
export const BrandMark: React.FC<BrandMarkProps> = ({
  className = 'h-6 w-6',
}) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <path
      d="M16 28.2C7.6 21.7 3 17.2 3 11.7 3 7.7 5.9 5 9.6 5c2.6 0 4.8 1.4 6.4 3.6C17.6 6.4 19.8 5 22.4 5 26.1 5 29 7.7 29 11.7c0 5.5-4.6 10-13 16.5z"
      className="fill-signal"
    />
    <path
      d="M5.5 15.2h5.6l2.3-4.4 3.5 9.2 2.6-4.8H26.5"
      fill="none"
      className="stroke-ink"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
