import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = t('Search'),
  label = t('Search'),
}) => (
  <label className="relative block w-full sm:max-w-sm">
    <span className="sr-only">{label}</span>
    <Icon
      name="search"
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/40"
    />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-11 pr-4 text-sm text-bone outline-none transition placeholder:text-bone/35 focus:border-signal/60 focus:ring-2 focus:ring-signal/15"
    />
  </label>
);
