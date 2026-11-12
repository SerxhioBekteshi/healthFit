import React from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterSelectProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  label: string;
}

// A compact dropdown for the toolbar of a Table, next to the search box.
export function FilterSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: FilterSelectProps<T>) {
  return (
    <label className="block w-full sm:w-auto">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-bone outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15 sm:w-auto"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.count === undefined
              ? option.label
              : `${option.label} (${option.count})`}
          </option>
        ))}
      </select>
    </label>
  );
}
