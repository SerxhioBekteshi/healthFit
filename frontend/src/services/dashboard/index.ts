import { apiClient } from '@/services/api';
import type {
  ClientDashboard,
  GymDashboard,
  PlatformDashboard,
} from '@gym/shared/types';

export const dashboardService = {
  gym: () => apiClient.get<GymDashboard>('/dashboard/gym'),
  client: () => apiClient.get<ClientDashboard>('/dashboard/client'),
  platform: () => apiClient.get<PlatformDashboard>('/dashboard/platform'),
};
