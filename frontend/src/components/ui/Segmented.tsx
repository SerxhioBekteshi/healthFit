import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  label: string;
}

// A pill that glides between options; the id keeps several controls on one page independent.
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: SegmentedProps<T>) {
  const id = useId();

  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
              selected ? 'text-ink' : 'text-bone/65 hover:text-bone'
            }`}
          >
            {selected ? (
              <motion.span
                layoutId={`segmented-${id}`}
                className="absolute inset-0 rounded-md bg-signal"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            ) : null}
            <span className="relative flex items-center gap-2">
              {option.label}
              {option.count !== undefined ? (
                <span
                  className={`rounded-full px-1.5 text-[0.62rem] ${
                    selected ? 'bg-ink/15' : 'bg-white/10'
                  }`}
                >
                  {option.count}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
