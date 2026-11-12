import { apiClient } from '@/services/api';
import type {
  GymSubscription,
  GymSubscriptionPayment,
} from '@gym/shared/types';
import type {
  CreateGymSubscriptionValues,
  SubscriptionPaymentValues,
  UpdateGymSubscriptionValues,
} from '@gym/shared/validation/gym-subscriptions';

export const gymSubscriptionsService = {
  list: () => apiClient.get<GymSubscription[]>('/gym-subscriptions'),
  payments: () => apiClient.get<GymSubscriptionPayment[]>('/billings'),
  create: (input: CreateGymSubscriptionValues) =>
    apiClient.post<GymSubscription>('/gym-subscriptions', input),
  update: (id: string, input: UpdateGymSubscriptionValues) =>
    apiClient.patch<GymSubscription>(`/gym-subscriptions/${id}`, input),
  setStatus: (id: string, status: 'active' | 'cancelled') =>
    apiClient.patch<GymSubscription>(`/gym-subscriptions/${id}/status`, {
      status,
    }),
  recordPayment: (id: string, input: SubscriptionPaymentValues) =>
    apiClient.post<GymSubscription>(`/gym-subscriptions/${id}/payments`, input),
};
