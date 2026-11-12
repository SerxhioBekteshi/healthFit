import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gymSubscriptionsService } from '@/services/gym-subscriptions';
import type {
  CreateGymSubscriptionValues,
  SubscriptionPaymentValues,
  UpdateGymSubscriptionValues,
} from '@gym/shared/validation/gym-subscriptions';

const subscriptionsKey = ['gym-subscriptions'] as const;
const paymentsKey = ['billings'] as const;

export const useGymSubscriptions = () => {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: subscriptionsKey }),
      queryClient.invalidateQueries({ queryKey: paymentsKey }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'platform'] }),
    ]);
  };

  const subscriptionsQuery = useQuery({
    queryKey: subscriptionsKey,
    queryFn: gymSubscriptionsService.list,
  });

  const paymentsQuery = useQuery({
    queryKey: paymentsKey,
    queryFn: gymSubscriptionsService.payments,
  });

  const createSubscription = useMutation({
    meta: { success: 'Subscription created.' },
    mutationFn: (input: CreateGymSubscriptionValues) =>
      gymSubscriptionsService.create(input),
    onSuccess: invalidate,
  });

  const updateSubscription = useMutation({
    meta: { success: 'Subscription updated.' },
    mutationFn: ({
      subscriptionId,
      input,
    }: {
      subscriptionId: string;
      input: UpdateGymSubscriptionValues;
    }) => gymSubscriptionsService.update(subscriptionId, input),
    onSuccess: invalidate,
  });

  const setSubscriptionStatus = useMutation({
    meta: { success: 'Subscription status updated.' },
    mutationFn: ({
      subscriptionId,
      status,
    }: {
      subscriptionId: string;
      status: 'active' | 'cancelled';
    }) => gymSubscriptionsService.setStatus(subscriptionId, status),
    onSuccess: invalidate,
  });

  const recordPayment = useMutation({
    meta: { success: 'Payment recorded.' },
    mutationFn: ({
      subscriptionId,
      input,
    }: {
      subscriptionId: string;
      input: SubscriptionPaymentValues;
    }) => gymSubscriptionsService.recordPayment(subscriptionId, input),
    onSuccess: invalidate,
  });

  return {
    subscriptions: subscriptionsQuery.data ?? [],
    payments: paymentsQuery.data ?? [],
    isLoading: subscriptionsQuery.isLoading || paymentsQuery.isLoading,
    error: subscriptionsQuery.error ?? paymentsQuery.error,
    createSubscription,
    updateSubscription,
    setSubscriptionStatus,
    recordPayment,
  };
};
