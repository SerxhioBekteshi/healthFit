import React from 'react';
import { SearchInput } from '@/components/ui/SearchInput';
import { t } from '@/i18n';

interface TableToolbarProps {
  // Hide the search box for a table without searchable columns.
  searchable: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  // Controls on the right, such as a status filter.
  children?: React.ReactNode;
  // The primary action (for example "Add"), always last.
  action?: React.ReactNode;
}

// The bar above a Table: search and extra filters.
export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchable,
  search,
  onSearchChange,
  placeholder = t('Search this table'),
  children,
  action,
}) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    {searchable ? (
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={placeholder}
      />
    ) : null}
    {children || action ? (
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {action}
      </div>
    ) : null}
  </div>
);
