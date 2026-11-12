import React from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { TablePagination } from '@/components/ui/TablePagination';
import { TableToolbar } from '@/components/ui/TableToolbar';
import { useFillHeight } from '@/hooks/fill-height';
import { t } from '@/i18n';
import type { Column, TableController } from '@/hooks/table';

export type { Column } from '@/hooks/table';

interface TableProps<T> {
  controller: TableController<T>;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyHint?: string;
  searchPlaceholder?: string;
  // Extra controls beside the search box, such as a status filter.
  toolbar?: React.ReactNode;
  // The footer with the range and page buttons. Page size and sizes come from useTableController.
  pagination?: boolean;
  // Rows-per-page selector in the footer.
  pageSizeSelector?: boolean;
  // Scroll the rows inside the card (header and footer stay put) so the page itself does not
  // scroll; the card grows to the bottom of the window and no further. Applies from md up.
  fillHeight?: boolean;
  // Space in px kept free under the card when it fills the window; match the layout's bottom padding.
  fillGap?: number;
  // Extra classes for a row, such as a highlight.
  rowClassName?: (row: T) => string;
}

// Rows slide in one after another; the delay is capped so long pages do not lag.
const rowDelay = (index: number): React.CSSProperties => ({
  animationDelay: `${Math.min(index, 12) * 35}ms`,
});

const SkeletonRows: React.FC = () => (
  <div className="space-y-3 p-5" aria-busy="true">
    {[0, 1, 2, 3].map((item) => (
      <div
        key={item}
        className="h-12 animate-pulse rounded-xl bg-white/[0.05]"
        style={{ animationDelay: `${item * 120}ms` }}
      />
    ))}
  </div>
);

const EmptyState: React.FC<{
  title: string;
  hint?: string;
  action?: React.ReactNode;
}> = ({ title, hint, action }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-bone/50">
      <Icon name="inbox" className="h-5 w-5" />
    </span>
    <p className="text-sm font-semibold text-bone">{title}</p>
    {hint ? <p className="max-w-xs text-sm text-bone/50">{hint}</p> : null}
    {action}
  </div>
);

function SortableHeader<T>({
  column,
  controller,
}: {
  column: Column<T>;
  controller: TableController<T>;
}) {
  if (!column.sortValue) return <>{column.header}</>;

  const direction =
    controller.sort?.key === column.key ? controller.sort.direction : null;

  return (
    <button
      type="button"
      onClick={() => controller.toggleSort(column.key)}
      className="inline-flex items-center gap-1 font-medium transition hover:text-bone"
    >
      {column.header}
      <Icon
        name="chevron"
        className={`h-3.5 w-3.5 transition ${
          direction === 'asc'
            ? '-rotate-90 text-signal'
            : direction === 'desc'
              ? 'rotate-90 text-signal'
              : 'rotate-90 opacity-30'
        }`}
      />
    </button>
  );
}

export function Table<T>({
  controller,
  rowKey,
  isLoading = false,
  error = null,
  emptyTitle = t('Nothing here yet'),
  emptyHint,
  searchPlaceholder,
  toolbar,
  pagination = true,
  pageSizeSelector = true,
  fillHeight = true,
  fillGap = 24,
  rowClassName,
}: TableProps<T>) {
  const fill = useFillHeight(fillHeight, fillGap);

  if (error) {
    return <Alert>{error}</Alert>;
  }

  const { columns, rows } = controller;
  const primary = columns.find((column) => column.primary) ?? columns[0];
  const actions = columns.find((column) => column.actions);
  const details = columns.filter(
    (column) => column !== primary && column !== actions
  );

  return (
    <>
      {controller.isSearchable || toolbar ? (
        <TableToolbar
          searchable={controller.isSearchable}
          search={controller.search}
          onSearchChange={controller.setSearch}
          placeholder={searchPlaceholder}
          shown={controller.total}
          all={controller.all}
        >
          {toolbar}
        </TableToolbar>
      ) : null}

      <div
        ref={fill.ref}
        style={
          fill.height === null
            ? undefined
            : ({ '--table-fill': `${fill.height}px` } as React.CSSProperties)
        }
      >
        <Card
          flush
          className={`flex flex-col overflow-hidden ${
            fill.height === null ? '' : 'md:max-h-[var(--table-fill)]'
          }`}
        >
          {isLoading ? (
            <SkeletonRows />
          ) : rows.length === 0 && controller.search.trim() !== '' ? (
            <EmptyState
              title={t('No matches')}
              hint={t('Nothing matches "{{search}}".', {
                search: controller.search.trim(),
              })}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => controller.setSearch('')}
                >
                  {t('Clear search')}
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState title={emptyTitle} hint={emptyHint} />
          ) : (
            <>
              <div className="hidden min-h-0 flex-1 overflow-auto md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-bone/50">
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className={`sticky top-0 z-10 bg-panel px-5 py-4 font-medium shadow-[inset_0_-1px_0_rgb(var(--c-white)/0.1)] ${
                            column.align === 'right' ? 'text-right' : ''
                          }`}
                        >
                          <SortableHeader
                            column={column}
                            controller={controller}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {rows.map((row, index) => (
                      <tr
                        key={rowKey(row)}
                        style={rowDelay(index)}
                        className={`transition-colors duration-200 motion-safe:animate-row-in hover:bg-white/[0.035] ${rowClassName?.(row) ?? ''}`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`px-5 py-4 text-bone/80 ${
                              column.align === 'right' ? 'text-right' : ''
                            }`}
                          >
                            {column.actions ? (
                              <div className="flex flex-wrap justify-end gap-2">
                                {column.cell(row)}
                              </div>
                            ) : (
                              column.cell(row)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-white/[0.06] md:hidden">
                {rows.map((row, index) => (
                  <li
                    key={rowKey(row)}
                    style={rowDelay(index)}
                    className={`space-y-3 p-4 motion-safe:animate-row-in ${rowClassName?.(row) ?? ''}`}
                  >
                    <div className="text-base font-semibold text-bone">
                      {primary.cell(row)}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {details.map((column) => (
                        <div key={column.key}>
                          <dt className="text-xs text-bone/45">
                            {column.header}
                          </dt>
                          <dd className="mt-0.5 text-sm text-bone/80">
                            {column.cell(row)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {actions ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {actions.cell(row)}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>

              {pagination ? (
                <TablePagination
                  controller={controller}
                  showPageSize={pageSizeSelector}
                />
              ) : null}
            </>
          )}
        </Card>
      </div>
    </>
  );
}
