import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { LoadMore } from '@/components/ui/LoadMore';
import { t } from '@/i18n';
import type { BalanceTransaction } from '@gym/shared/types';
import { paymentMethodLabels } from '@/utils/constants/labels';
import { formatDateTime } from '@/utils/format';

interface BalanceTransactionListProps {
  transactions: BalanceTransaction[];
  // Set together to load older rows when the end of the list scrolls into view.
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreFailed?: boolean;
  onLoadMore?: () => void;
  // Filters are on, so an empty list means nothing matched.
  filtered?: boolean;
}

export const BalanceTransactionList: React.FC<BalanceTransactionListProps> = ({
  transactions,
  hasMore = false,
  isLoadingMore = false,
  loadMoreFailed = false,
  onLoadMore,
  filtered = false,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-bone/50">
          <Icon name="inbox" className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-bone">
          {filtered
            ? t('No transactions match these filters')
            : t('No transactions yet')}
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-white/[0.06]">
        {transactions.map((transaction) => {
          const credit = transaction.amount >= 0;
          return (
            <li
              key={transaction.id}
              className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.035]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-bone">
                  {transaction.description}
                </p>
                <p className="mt-0.5 text-xs text-bone/50">
                  {paymentMethodLabels[transaction.paymentMethod]} ·{' '}
                  {formatDateTime(transaction.createdAt)}
                </p>
                <p className="mt-1 text-xs text-bone/35">
                  {transaction.type} · {transaction.providerStatus}
                </p>
              </div>
              <span
                className={`shrink-0 text-base font-bold tabular-nums ${
                  credit ? 'text-signal' : 'text-danger'
                }`}
              >
                {credit ? '+' : ''}
                {transaction.amount.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
      {onLoadMore ? (
        <LoadMore
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadMoreFailed={loadMoreFailed}
          onLoadMore={onLoadMore}
          itemCount={transactions.length}
          className="border-t border-white/[0.06] p-4"
        />
      ) : null}
    </>
  );
};
