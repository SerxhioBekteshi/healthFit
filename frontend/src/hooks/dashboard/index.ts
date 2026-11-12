import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';

// Dashboards read from many domains, so keep them fresh instead of cached for minutes.
const REFRESH_MS = 60_000;

export const useGymDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'gym'],
    queryFn: dashboardService.gym,
    refetchInterval: REFRESH_MS,
  });

export const useClientDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'client'],
    queryFn: dashboardService.client,
    refetchInterval: REFRESH_MS,
  });

export const usePlatformDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'platform'],
    queryFn: dashboardService.platform,
    refetchInterval: REFRESH_MS,
  });
