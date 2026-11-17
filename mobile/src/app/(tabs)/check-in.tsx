import React from 'react';
import { AccessPanel } from '@/components/access/AccessPanel';
import { MemberPassCard } from '@/components/access/MemberPassCard';
import { Banner } from '@/components/ui/Banner';
import { LoadingView } from '@/components/ui/LoadingView';
import { Screen } from '@/components/ui/Screen';
import { useClientDashboard, useMemberPass } from '@/hooks/dashboard';
import { useRefresh } from '@/hooks/refresh';
import { useTranslation } from '@/i18n';

export default function CheckInScreen(): React.ReactElement {
  const { t } = useTranslation();
  const dashboard = useClientDashboard();
  const pass = useMemberPass();
  const { refreshing, onRefresh } = useRefresh(dashboard.refetch);
  const data = dashboard.data;

  return (
    <Screen
      title={t('Check-in')}
      subtitle={t('Scan your code or tap your card at reception.')}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      {data && !data.activeMembership ? (
        <Banner
          tone="warning"
          message={t(
            'You have no active membership, so check-in will be refused. Choose a plan in the Membership tab.'
          )}
        />
      ) : null}

      {pass ? (
        <MemberPassCard pass={pass} />
      ) : dashboard.isPending ? (
        <LoadingView />
      ) : (
        <Banner
          tone="danger"
          message={t(
            'Your pass could not be loaded. Connect to the internet once to save it on this phone.'
          )}
        />
      )}

      {data ? (
        <AccessPanel data={data} />
      ) : pass && dashboard.error ? (
        <Banner
          tone="info"
          message={t(
            'You are offline. Your pass still works; card and locker details load when you are back online.'
          )}
        />
      ) : null}
    </Screen>
  );
}
