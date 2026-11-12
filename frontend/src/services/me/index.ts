import { apiClient } from '@/services/api';
import type { User } from '@gym/shared/types';

export const meService = {
  get: () => apiClient.get<User>('/me'),
};
