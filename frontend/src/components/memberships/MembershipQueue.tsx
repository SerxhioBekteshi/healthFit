import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { t } from '@/i18n';
import {
  membershipStatusLabels,
  membershipStatusTone,
} from '@/utils/constants/labels';
import { formatDay, formatMoney } from '@/utils/format';
import { daysUntil, nextStart } from '@/utils/memberships';
import type { Membership } from '@gym/shared/types';

interface MembershipQueueProps {
  memberships: Membership[];
}

const inDays = (days: number, verb: 'Ends' | 'Starts'): string => {
  if (verb === 'Ends') {
    if (days <= 0) return t('Ends today');
    return days === 1
      ? t('Ends in 1 day')
      : t('Ends in {{n}} days', { n: days });
  }
  if (days <= 0) return t('Starts today');
  return days === 1
    ? t('Starts in 1 day')
    : t('Starts in {{n}} days', { n: days });
};

const timing = (membership: Membership): string => {
  if (membership.status === 'active') {
    return inDays(daysUntil(membership.endDate), 'Ends');
  }
  if (membership.status === 'upcoming') {
    return inDays(daysUntil(membership.startDate), 'Starts');
  }
  return '';
};

// The running membership followed by the paid ones queued behind it, each with its own dates.
export const MembershipQueue: React.FC<MembershipQueueProps> = ({
  memberships,
}) => {
  const queue = memberships
    .filter((item) => ['active', 'upcoming', 'pending'].includes(item.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (queue.length === 0) {
    return null;
  }
  const next = nextStart(memberships);

  return (
    <section className="mb-6 rounded-xl border border-white/10 bg-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-bone">
          {t('Your memberships')}
        </h2>
        {queue.length > 1 ? (
          <p className="text-xs text-bone/50">
            {t('{{n}} in your queue, used one after another', {
              n: queue.length,
            })}
          </p>
        ) : null}
      </div>

      <ol className="mt-4 space-y-2.5">
        {queue.map((membership, index) => (
          <li
            key={membership.id}
            className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <span
              aria-hidden
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 text-xs font-semibold tabular-nums text-bone/70"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-bone">
                {membership.planName}
                <Badge tone={membershipStatusTone[membership.status]}>
                  {membership.status === 'pending'
                    ? t('Waiting for payment')
                    : membershipStatusLabels[membership.status]}
                </Badge>
              </p>
              <p className="mt-1 text-sm tabular-nums text-bone/60">
                {t('Starts {{start}} · Ends {{end}}', {
                  start: formatDay(membership.startDate),
                  end: formatDay(membership.endDate),
                })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium tabular-nums text-bone">
                {formatMoney(membership.price)}
              </p>
              <p className="mt-0.5 text-xs text-bone/50">
                {timing(membership)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {next.queued ? (
        <p className="mt-4 border-t border-white/[0.08] pt-3 text-sm text-bone/55">
          {t(
            'Another plan you buy now starts on {{date}}, right after your last one ends.',
            { date: formatDay(next.date) }
          )}
        </p>
      ) : null}
    </section>
  );
};
