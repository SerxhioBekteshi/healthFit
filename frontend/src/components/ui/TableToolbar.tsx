import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { t } from '@/i18n';

interface TableToolbarProps {
  // Hide the search box for a table without searchable columns.
  searchable: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  // Rows after search and filter, and all rows.
  shown: number;
  all: number;
  // Controls on the right, such as a status filter.
  children?: React.ReactNode;
}

// The bar above a Table: search, result count and extra filters.
export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchable,
  search,
  onSearchChange,
  placeholder = t('Search this table'),
  shown,
  all,
  children,
}) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    {searchable ? (
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={placeholder}
        />
        <p
          aria-live="polite"
          className="shrink-0 text-xs tabular-nums text-bone/50"
        >
          {shown === all
            ? all === 1
              ? t('1 row')
              : t('{{n}} rows', { n: all })
            : t('{{shown}} of {{all}}', { shown, all })}
        </p>
      </div>
    ) : null}
    {children}
  </div>
);
