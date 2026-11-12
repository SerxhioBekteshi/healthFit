import React from 'react';
import {
  buildPriceTable,
  type PriceCell,
} from '@/components/membership-plans/priceTable';
import { getCurrency, t } from '@/i18n';
import { formatAmount, formatMoney } from '@/utils/format';
import type { MembershipPlan } from '@gym/shared/types';

interface PriceMatrixProps {
  plans: MembershipPlan[];
  // Makes every price a button, e.g. to subscribe.
  onSelect?: (plan: MembershipPlan) => void;
  disabled?: boolean;
}

export const FrequencyHeading: React.FC<{ weeklyVisits: number }> = ({
  weeklyVisits,
}) => (
  <>
    <span className="font-display text-2xl font-normal leading-none text-bone sm:text-3xl">
      {weeklyVisits > 0 ? weeklyVisits : t('All')}
      <span className="text-signal">{weeklyVisits > 0 ? '×' : ''}</span>
    </span>
    <span className="mt-1 block text-[0.62rem] font-semibold uppercase text-bone/45">
      {weeklyVisits > 0 ? t('per week') : t('unlimited')}
    </span>
  </>
);

const PriceBody: React.FC<{ cell: PriceCell }> = ({ cell }) => (
  <>
    <span className="block font-display text-xl font-normal tabular-nums text-bone sm:text-2xl">
      {formatAmount(cell.plan.price)}
      <span className="ml-1 font-sans text-[0.62rem] font-semibold tracking-wider text-bone/45">
        {getCurrency()}
      </span>
    </span>
    {cell.saving > 0 ? (
      <span className="mt-0.5 block text-[0.68rem] font-medium text-signal">
        {t('save {{amount}}', { amount: formatMoney(cell.saving) })}
      </span>
    ) : null}
  </>
);

// The standard price list: weekly frequency across, term down, one price per cell.
export const PriceMatrix: React.FC<PriceMatrixProps> = ({
  plans,
  onSelect,
  disabled = false,
}) => {
  const { columns, rows } = buildPriceTable(plans);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-panel shadow-sm">
      <div className="border-b border-white/[0.08] px-5 py-5">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-signal">
          {t('Standard subscriptions')}
        </p>
        <p className="mt-1 font-display text-3xl font-normal text-bone">
          {t('Price list')}
        </p>
        {onSelect ? (
          <p className="mt-2 text-sm text-bone/55">
            {t(
              'Tap a price to subscribe: pick your weekly visits and how long.'
            )}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="px-5 py-4 text-[0.62rem] font-semibold uppercase leading-snug text-bone/45">
                {t('Subscription')}
                <br />
                {t('per term')}
              </th>
              {columns.map((weeklyVisits) => (
                <th key={weeklyVisits} className="px-2 py-4 text-center">
                  <FrequencyHeading weeklyVisits={weeklyVisits} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.term.type} className="group">
                <th
                  scope="row"
                  className="border-t border-white/[0.08] px-5 py-4 font-display text-lg font-normal text-bone sm:text-xl"
                >
                  {row.term.label}
                </th>
                {columns.map((weeklyVisits) => {
                  const cell = row.cells[weeklyVisits];
                  return (
                    <td
                      key={weeklyVisits}
                      className="border-t border-white/[0.08] p-1.5 text-center"
                    >
                      {!cell ? (
                        <span className="text-bone/25">&mdash;</span>
                      ) : onSelect ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onSelect(cell.plan)}
                          aria-label={t(
                            'Subscribe: {{frequency}}, {{term}}, {{price}}',
                            {
                              frequency:
                                weeklyVisits > 0
                                  ? t('{{n}} per week', { n: weeklyVisits })
                                  : t('unlimited'),
                              term: row.term.label,
                              price: formatMoney(cell.plan.price),
                            }
                          )}
                          className="w-full rounded-md px-2 py-3 transition-colors duration-200 hover:bg-signal/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <PriceBody cell={cell} />
                        </button>
                      ) : (
                        <div className="px-2 py-3">
                          <PriceBody cell={cell} />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
