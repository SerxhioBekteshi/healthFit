import React from 'react';

export const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className ?? 'h-4 w-4'}
    aria-hidden
  >
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);
