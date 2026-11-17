import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { memberPassStore, type MemberPass } from '@/storage/member-pass';
import { queryKeys } from '../query-keys';

export const useClientDashboard = () =>
  useQuery({
    queryKey: [...queryKeys.dashboard, 'client'],
    queryFn: dashboardService.client,
  });

// The check-in pass: live data when there is a connection, the saved copy when there is not.
export const useMemberPass = (): MemberPass | null => {
  const { data } = useClientDashboard();
  const clientId = data?.clientId;
  const fullName = data?.fullName;
  const [saved, setSaved] = useState<MemberPass | null>(null);

  const live = useMemo<MemberPass | null>(
    () => (clientId && fullName ? { clientId, fullName } : null),
    [clientId, fullName]
  );

  useEffect(() => {
    void memberPassStore.load().then(setSaved);
  }, []);

  // Keep the copy on the phone current for the next time there is no signal.
  useEffect(() => {
    if (live) void memberPassStore.save(live);
  }, [live]);

  return live ?? saved;
};
