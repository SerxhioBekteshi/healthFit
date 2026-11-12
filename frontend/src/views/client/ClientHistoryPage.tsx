import React, { useMemo, useState } from 'react';
import { MembershipHistoryFiltersForm } from '@/components/memberships/MembershipHistoryFilters';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';
import { Card, CardTitle } from '@/components/ui/Card';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadMore } from '@/components/ui/LoadMore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAttendanceHistory } from '@/hooks/attendance';
import { useDebouncedValue } from '@/hooks/debounce';
import { useMembershipHistory } from '@/hooks/memberships';
import { msg, t, translated } from '@/i18n';
import {
  membershipStatusLabels,
  membershipStatusTone,
} from '@/utils/constants/labels';
import { countFilters, sendableMembershipFilters } from '@/utils/filters';
import { formatDateTime, formatDay, formatMoney } from '@/utils/format';
import type {
  MembershipHistoryFilters,
  MembershipPaymentStatus,
} from '@gym/shared/types';

const paymentStatusLabels = translated<MembershipPaymentStatus>({
  paid: msg('payment paid'),
  pending: msg('payment pending'),
  failed: msg('payment failed'),
});

export const ClientHistoryPage: React.FC = () => {
  const [filters, setFilters] = useState<MembershipHistoryFilters>({});
  const applied = useDebouncedValue(
    useMemo(() => sendableMembershipFilters(filters), [filters])
  );
  const {
    memberships,
    isLoading: membershipsLoading,
    isFiltering,
    pagination: membershipPagination,
  } = useMembershipHistory(applied);
  const {
    records,
    isLoading: attendanceLoading,
    pagination,
  } = useAttendanceHistory();

  return (
    <>
      <PageHeader
        eyebrow={t('Member area')}
        title={t('Your')}
        accent={t('history')}
        description={t('Memberships and check-ins over time.')}
      />

      {/* Below lg the cards stack and each list caps its own height. */}
      <div className="grid gap-4 lg:h-[calc(100vh-17.5rem)] lg:min-h-[22rem] lg:grid-cols-2 lg:grid-rows-1">
        <Card className="client-card-reveal flex min-h-0 flex-col">
          <FilterBar
            title={t('Membership history')}
            activeCount={countFilters(filters)}
            onClear={() => setFilters({})}
            className="mb-5"
          >
            <MembershipHistoryFiltersForm
              value={filters}
              onChange={setFilters}
            />
          </FilterBar>
          {membershipsLoading ? <Skeleton className="h-32" /> : null}
          {!membershipsLoading && memberships.length === 0 ? (
            <p className="text-sm text-bone/50">
              {countFilters(applied) > 0
                ? t('No memberships match these filters.')
                : t('No memberships recorded yet.')}
            </p>
          ) : null}
          {memberships.length > 0 ? (
            // The padding keeps the timeline dots from being clipped by the scroll area.
            <div
              className={`max-h-[28rem] min-h-0 flex-1 overflow-y-auto pl-2 transition-opacity lg:max-h-none ${
                isFiltering ? 'opacity-50' : ''
              }`}
            >
              <ol className="relative space-y-5 border-l border-white/10 pl-6">
                {memberships.map((membership) => (
                  <li key={membership.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-graphite bg-signal"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-bone">
                          {membership.planName}
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-bone/50">
                          {formatDay(membership.startDate)} →{' '}
                          {formatDay(membership.endDate)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge tone={membershipStatusTone[membership.status]}>
                            {membershipStatusLabels[membership.status]}
                          </Badge>
                          <span className="text-xs text-bone/45">
                            {paymentStatusLabels[membership.paymentStatus]}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-bone">
                        <AnimatedNumber
                          value={membership.price}
                          format={formatMoney}
                        />
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
              <LoadMore
                {...membershipPagination}
                itemCount={memberships.length}
                className="pt-4"
              />
            </div>
          ) : null}
        </Card>

        <Card className="client-card-reveal flex min-h-0 flex-col">
          <CardTitle title={t('Attendance history')} />
          {attendanceLoading ? <Skeleton className="h-32" /> : null}
          {!attendanceLoading && records.length === 0 ? (
            <p className="text-sm text-bone/50">
              {t('No check-ins recorded yet.')}
            </p>
          ) : null}
          {records.length > 0 ? (
            <div className="max-h-[28rem] min-h-0 flex-1 overflow-y-auto lg:max-h-none">
              <ul className="divide-y divide-white/[0.06] text-sm text-bone/80">
                {records.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center gap-3 py-3 tabular-nums"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                    {formatDateTime(record.checkedInAt)}
                    {record.locationName ? (
                      <span className="ml-auto truncate text-xs text-bone/50">
                        {record.locationName}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <LoadMore
                {...pagination}
                itemCount={records.length}
                className="border-t border-white/[0.06] pt-3"
              />
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
};
