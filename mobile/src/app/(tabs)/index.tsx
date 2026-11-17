import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { AttendanceHistorySheet } from '@/components/attendance/AttendanceHistorySheet';
import { MembershipSummaryCard } from '@/components/dashboard/MembershipSummaryCard';
import { WeekCalendar } from '@/components/dashboard/WeekCalendar';
import { Banner } from '@/components/ui/Banner';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Screen } from '@/components/ui/Screen';
import { StatRow } from '@/components/ui/StatRow';
import { Text } from '@/components/ui/Text';
import { useClientDashboard } from '@/hooks/dashboard';
import { useMoney } from '@/hooks/money';
import { useRefresh } from '@/hooks/refresh';
import { useTranslation } from '@/i18n';
import { useSession } from '@/providers/SessionProvider';
import { firstName } from '@/utils/format';

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useSession();
  const formatMoney = useMoney();
  const dashboard = useClientDashboard();
  const { refreshing, onRefresh } = useRefresh(dashboard.refetch);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <Screen
      title={
        user
          ? t('Hi, {{name}}', { name: firstName(user.fullName) })
          : t('Welcome')
      }
      subtitle={t('Let’s train')}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      <QueryBoundary query={dashboard}>
        {(data) => (
          <>
            {data.checkedIn ? (
              <Banner
                tone="success"
                message={t('You are checked in. Enjoy your workout!')}
              />
            ) : null}
            <MembershipSummaryCard
              membership={data.activeMembership}
              onChoosePlan={() => router.navigate('/membership')}
            />
            <WeekCalendar
              week={data.week}
              onOpenHistory={() => setHistoryOpen(true)}
            />
            <AttendanceHistorySheet
              visible={historyOpen}
              today={data.week.today}
              onClose={() => setHistoryOpen(false)}
            />
            <ListGroup>
              <ListRow
                icon="wallet-outline"
                title={t('Balance')}
                trailing={
                  <Text variant="bodyStrong">{formatMoney(data.balance)}</Text>
                }
                onPress={() => router.push('/balance')}
              />
            </ListGroup>
            <StatRow
              stats={[
                { label: t('Check-ins'), value: data.attendance.total },
                { label: t('Last 7 days'), value: data.attendance.last7Days },
                { label: t('Last 30 days'), value: data.attendance.last30Days },
              ]}
            />
            <Text variant="caption" tone="subtle" align="center">
              {data.currentlyInside === 1
                ? t('1 person in the gym now')
                : t('{{n}} people in the gym now', { n: data.currentlyInside })}
            </Text>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}
