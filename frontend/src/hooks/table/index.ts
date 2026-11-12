import { useState, type ReactNode } from 'react';
import { currentLocale } from '@/utils/format';

export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  // Becomes the card title on small screens.
  primary?: boolean;
  // Rendered as the action row on small screens.
  actions?: boolean;
  // Makes the column sortable by this value.
  sortValue?: (row: T) => string | number | null | undefined;
  // Text of the cell as the user reads it; the search box matches it.
  searchValue?: (row: T) => string | number | null | undefined;
}

export interface TableControllerOptions<T> {
  rows: T[];
  columns: Column<T>[];
  // Extra text the search box matches that no column shows, such as an email inside a name cell.
  searchFields?: (row: T) => Array<string | null | undefined>;
  filter?: (row: T) => boolean;
  // Rows per page to start with, and the sizes the page-size selector offers.
  pageSize?: number;
  pageSizeOptions?: number[];
  initialSort?: TableSort;
}

export interface TableController<T> {
  columns: Column<T>[];
  // Rows of the current page.
  rows: T[];
  // Rows matching search and filter, across all pages.
  total: number;
  // All rows before search and filter.
  all: number;
  // True when a column has a `searchValue` or `searchFields` is set.
  isSearchable: boolean;
  search: string;
  setSearch: (value: string) => void;
  sort: TableSort | null;
  toggleSort: (key: string) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

const DEFAULT_PAGE_SIZES = [10, 25, 50];

const compareValues = (
  collator: Intl.Collator,
  a: string | number | null | undefined,
  b: string | number | null | undefined
): number => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
};

const sortRows = <T>(
  rows: T[],
  columns: Column<T>[],
  sort: TableSort | null
): T[] => {
  const column = sort ? columns.find((item) => item.key === sort.key) : null;
  const accessor = column?.sortValue;
  if (!sort || !accessor) return rows;
  const factor = sort.direction === 'asc' ? 1 : -1;
  const collator = new Intl.Collator(currentLocale(), {
    numeric: true,
    sensitivity: 'base',
  });
  return [...rows].sort(
    (a, b) => factor * compareValues(collator, accessor(a), accessor(b))
  );
};

// State and derived rows of a Table: search, filter, sort and pagination.
export const useTableController = <T>({
  rows,
  columns,
  searchFields,
  filter,
  pageSize: initialPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  initialSort,
}: TableControllerOptions<T>): TableController<T> => {
  const [search, setSearchValue] = useState('');
  const [sort, setSort] = useState<TableSort | null>(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeValue] = useState(initialPageSize);
  // The starting size is always one of the choices.
  const sizes = [...new Set([...pageSizeOptions, initialPageSize])].sort(
    (a, b) => a - b
  );

  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  // Every word has to appear somewhere in the row, in any column.
  const matchesSearch = (row: T): boolean => {
    if (words.length === 0) return true;
    const text = [
      ...columns.map((column) => column.searchValue?.(row)),
      ...(searchFields?.(row) ?? []),
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(' ')
      .toLowerCase();
    return words.every((word) => text.includes(word));
  };
  const matching = rows.filter(
    (row) => (!filter || filter(row)) && matchesSearch(row)
  );
  const sorted = sortRows(matching, columns, sort);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;

  const setSearch = (value: string): void => {
    setSearchValue(value);
    setPage(0);
  };

  const setPageSize = (size: number): void => {
    setPageSizeValue(size);
    setPage(0);
  };

  const toggleSort = (key: string): void => {
    setPage(0);
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  return {
    columns,
    rows: sorted.slice(start, start + pageSize),
    total: sorted.length,
    all: rows.length,
    isSearchable:
      searchFields !== undefined ||
      columns.some((column) => column.searchValue !== undefined),
    search,
    setSearch,
    sort,
    toggleSort,
    page: currentPage,
    pageCount,
    pageSize,
    pageSizeOptions: sizes,
    setPage,
    setPageSize,
  };
};
