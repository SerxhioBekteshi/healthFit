import React from 'react';
import { useCountUp } from '@/hooks/count-up';
import { formatAmount } from '@/utils/format';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
}

const defaultFormat = (value: number): string =>
  formatAmount(Math.round(value));

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format = defaultFormat,
}) => {
  const shown = useCountUp(value);
  return <span className="tabular-nums">{format(shown)}</span>;
};
