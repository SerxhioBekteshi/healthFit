import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { t } from '@/i18n';
import { dateTimeFormat } from '@/utils/format';

const when = (iso: string): string => {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return t('Just now');
  if (minutes < 60) return t('{{n}} min ago', { n: minutes });
  return date.toDateString() === new Date().toDateString()
    ? dateTimeFormat({ hour: '2-digit', minute: '2-digit' }).format(date)
    : dateTimeFormat({
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
};

interface CheckInListProps {
  checkIns: {
    clientName: string;
    checkedInAt: string;
    locationName?: string | null;
  }[];
  // Show which gym each member trained at; useful when the owner has several.
  showLocation?: boolean;
}

// Compact rows of who checked in and when.
export const CheckInList: React.FC<CheckInListProps> = ({
  checkIns,
  showLocation = false,
}) =>
  checkIns.length === 0 ? (
    <p className="mt-4 text-sm text-bone/40">{t('No check-ins yet.')}</p>
  ) : (
    <ul className="mt-3 divide-y divide-white/[0.07]">
      {checkIns.map((item) => (
        <li
          key={`${item.clientName}-${item.checkedInAt}`}
          className="flex items-center gap-3 py-2.5"
        >
          <Avatar name={item.clientName} size="sm" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-bone">
            {item.clientName}
            {showLocation && item.locationName ? (
              <span className="block truncate text-xs font-normal text-bone/45">
                {item.locationName}
              </span>
            ) : null}
          </p>
          <p className="shrink-0 text-xs tabular-nums text-bone/50">
            {when(item.checkedInAt)}
          </p>
        </li>
      ))}
    </ul>
  );
