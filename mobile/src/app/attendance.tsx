import React from 'react';
import { VisitRow } from '@/components/attendance/VisitRow';
import { InfiniteList } from '@/components/ui/InfiniteList';
import { useAttendanceHistory } from '@/hooks/attendance';
import { useTranslation } from '@/i18n';

export default function AttendanceScreen(): React.ReactElement {
  const { t } = useTranslation();
  const history = useAttendanceHistory();

  return (
    <InfiniteList
      data={history.data}
      query={history}
      keyExtractor={(record) => record.id}
      renderItem={(record) => <VisitRow record={record} />}
      emptyTitle={t('No visits yet')}
      emptyMessage={t(
        'Your check-ins will show up here after your first workout.'
      )}
    />
  );
}
