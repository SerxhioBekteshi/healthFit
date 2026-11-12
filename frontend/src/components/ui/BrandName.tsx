import React from 'react';

// "Health" in plain text, "FIT" in the accent colour.
export const BrandName: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <span className={`font-semibold tracking-tight text-bone ${className}`}>
    Health<span className="text-signal">FIT</span>
  </span>
);
