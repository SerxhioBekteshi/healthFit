import React, { useState } from 'react';
import {
  buildPriceTable,
  type PriceCell,
} from '@/components/membership-plans/priceTable';
import { getCurrency, t } from '@/i18n';
import { formatAmount, formatDay, formatMoney } from '@/utils/format';
import { planPrice } from '@/utils/memberships';
import type { MembershipPlan } from '@gym/shared/types';

interface PriceCardsProps {
  plans: MembershipPlan[];
  // Makes every card a button, e.g. to subscribe.
  onSelect?: (plan: MembershipPlan) => void;
  disabled?: boolean;
  // Set when the whole list is one special offer: its name is already in the heading.
  showOfferName?: boolean;
}

const frequencyLabel = (weeklyVisits: number): string =>
  weeklyVisits > 0 ? t('{{n}}x per week', { n: weeklyVisits }) : t('Unlimited');

const CardBody: React.FC<{
  term: string;
  cell: PriceCell;
  showOfferName: boolean;
}> = ({ term, cell, showOfferName }) => (
  <>
    <span className="min-w-0 text-left">
      <span className="block font-display text-lg text-bone">{term}</span>
      {cell.plan.offer && showOfferName ? (
        <span className="mt-0.5 block text-xs font-medium text-signal">
          {t('{{name}}, until {{date}}', {
            name: cell.plan.offer.name,
            date: formatDay(cell.plan.offer.endDate),
          })}
        </span>
      ) : !cell.plan.offer && cell.saving > 0 ? (
        <span className="mt-0.5 block text-xs font-medium text-signal">
          {t('save {{amount}}', { amount: formatMoney(cell.saving) })}
        </span>
      ) : null}
    </span>
    <span className="shrink-0 text-right">
      {cell.plan.offer ? (
        <span className="block text-xs tabular-nums text-bone/40 line-through">
          {formatAmount(cell.plan.price)}
        </span>
      ) : null}
      <span
        className={`block font-display text-xl tabular-nums ${
          cell.plan.offer ? 'text-signal' : 'text-bone'
        }`}
      >
        {formatAmount(planPrice(cell.plan))}
        <span className="ml-1 font-sans text-[0.62rem] font-semibold tracking-wider text-bone/45">
          {getCurrency()}
        </span>
      </span>
    </span>
  </>
);

// The price list for narrow screens, like the mobile app: pick how often you train, then see one card per term.
export const PriceCards: React.FC<PriceCardsProps> = ({
  plans,
  onSelect,
  disabled = false,
  showOfferName = true,
}) => {
  const { columns, rows } = buildPriceTable(plans);
  const [chosen, setChosen] = useState<number | null>(null);
  const frequency =
    chosen !== null && columns.includes(chosen) ? chosen : columns[0];

  if (frequency === undefined) return null;

  const cardClass =
    'flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5';

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label={t('How often do you train?')}
        className="flex flex-wrap gap-2"
      >
        {columns.map((weeklyVisits) => {
          const selected = weeklyVisits === frequency;
          return (
            <button
              key={weeklyVisits}
              type="button"
              aria-pressed={selected}
              onClick={() => setChosen(weeklyVisits)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? 'border-signal bg-signal text-ink'
                  : 'border-white/15 text-bone/75 hover:border-white/30'
              }`}
            >
              {frequencyLabel(weeklyVisits)}
            </button>
          );
        })}
      </div>

      <ul className="space-y-2.5">
        {rows.map((row) => {
          const cell = row.cells[frequency];
          if (!cell) return null;
          return (
            <li key={row.term.type}>
              {onSelect ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(cell.plan)}
                  aria-label={t(
                    'Subscribe: {{frequency}}, {{term}}, {{price}}',
                    {
                      frequency: frequencyLabel(frequency),
                      term: row.term.label,
                      price: formatMoney(planPrice(cell.plan)),
                    }
                  )}
                  className={`${cardClass} transition-colors hover:border-signal/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <CardBody
                    term={row.term.label}
                    cell={cell}
                    showOfferName={showOfferName}
                  />
                </button>
              ) : (
                <div className={cardClass}>
                  <CardBody
                    term={row.term.label}
                    cell={cell}
                    showOfferName={showOfferName}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
