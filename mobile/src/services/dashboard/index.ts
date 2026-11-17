import { apiClient } from '@/api/client';
import type { ClientDashboard } from '@gym/shared/types';

export const dashboardService = {
  client: () => apiClient.get<ClientDashboard>('/dashboard/client'),
};
