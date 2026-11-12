import React from 'react';
import { BrandMark } from '@/components/ui/BrandMark';

export const Wordmark: React.FC<{ className?: string }> = ({ className }) => (
  <span className={`inline-flex items-center gap-3 ${className ?? ''}`}>
    <BrandMark className="h-8 w-8" />
  </span>
);
