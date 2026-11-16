import React from 'react';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { Icon } from '@/components/ui/Icon';

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

const optionLabel = <T extends string>(option: Option<T>): string =>
  option.count === undefined
    ? option.label
    : `${option.label} (${option.count})`;

// A pill-shaped dropdown for the toolbar of a Table, next to the search box.
export function FilterSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: FilterSelectProps<T>) {
  const selected = options.find((option) => option.value === value);

  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        aria-label={label}
        className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-2 pl-4 pr-3 text-sm font-medium text-bone outline-none transition hover:border-signal/40 hover:bg-white/[0.08] data-[open]:border-signal/60 data-[open]:ring-2 data-[open]:ring-signal/15"
      >
        {selected ? optionLabel(selected) : label}
        <Icon
          name="chevron"
          className="h-3.5 w-3.5 rotate-90 text-bone/50 transition group-data-[open]:text-bone/80"
        />
      </ListboxButton>
      {/* Rendered in a portal so the table's overflow cannot clip it; it re-applies the theme tokens. */}
      <ListboxOptions
        anchor="bottom start"
        transition
        className="app-shell z-50 min-w-[10rem] origin-top rounded-xl border border-white/10 bg-graphite p-1.5 text-bone shadow-[0_20px_50px_var(--shadow)] [--anchor-gap:6px] transition duration-150 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-bone/80 transition data-[focus]:bg-white/[0.07] data-[selected]:font-semibold data-[selected]:text-signal"
          >
            {optionLabel(option)}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
