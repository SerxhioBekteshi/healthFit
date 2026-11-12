import React from 'react';
import { Button } from '@/components/ui/Button';
import type { TableController } from '@/hooks/table';
import { t } from '@/i18n';

interface TablePaginationProps<T> {
  controller: TableController<T>;
  // Show the rows-per-page selector (needs more than one size option).
  showPageSize?: boolean;
}

// Page numbers around the current page, with the first and last page and gaps between.
const pageItems = (page: number, count: number): Array<number | string> => {
  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index);
  }
  const pages = [...new Set([0, count - 1, page - 1, page, page + 1])]
    .filter((value) => value >= 0 && value < count)
    .sort((a, b) => a - b);
  const items: Array<number | string> = [];
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) {
      items.push(`gap-${value}`);
    }
    items.push(value);
  });
  return items;
};

// Footer of a Table: range, rows per page and page buttons.
export function TablePagination<T>({
  controller,
  showPageSize = true,
}: TablePaginationProps<T>) {
  const { page, pageCount, pageSize, pageSizeOptions, total, setPage } =
    controller;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-bone/50">
        <p className="tabular-nums">
          {t('Showing {{from}}–{{to}} of {{total}}', { from, to, total })}
        </p>
        {showPageSize && pageSizeOptions.length > 1 ? (
          <label className="flex items-center gap-2">
            {t('Rows per page')}
            <select
              value={pageSize}
              onChange={(event) =>
                controller.setPageSize(Number(event.target.value))
              }
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-bone outline-none focus:border-signal/60"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {pageCount > 1 ? (
        <nav aria-label={t('Pagination')} className="flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            {t('Previous')}
          </Button>
          {pageItems(page, pageCount).map((item) =>
            typeof item === 'string' ? (
              <span
                key={item}
                aria-hidden
                className="hidden px-1 text-xs text-bone/40 sm:inline"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={t('Page {{n}}', { n: item + 1 })}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => setPage(item)}
                className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium tabular-nums transition-colors ${
                  item === page
                    ? 'bg-signal text-ink'
                    : 'hidden text-bone/70 hover:bg-white/10 hover:text-bone sm:inline-block'
                }`}
              >
                {item + 1}
              </button>
            )
          )}
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= pageCount - 1}
            onClick={() => setPage(page + 1)}
          >
            {t('Next')}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
