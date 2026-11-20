import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  memberships: ['memberships'] as const,
  membershipPlans: ['membership-plans'] as const,
  attendance: ['attendance'] as const,
  balance: ['balance'] as const,
  paymentSettings: ['payment-settings'] as const,
  accessSettings: ['access-settings'] as const,
  classes: ['classes'] as const,
  workoutPrograms: ['workout-programs'] as const,
  gymLocations: ['gym-locations'] as const,
  communityGyms: (country: string) => ['community-gyms', country] as const,
  products: ['products'] as const,
  gymJoin: (joinCode: string) => ['gym-join', joinCode] as const,
};

// Money, memberships and visits feed each other, so a payment or a check-out refreshes them all.
export const invalidateMemberData = (queryClient: QueryClient): Promise<void> =>
  Promise.all(
    [
      queryKeys.dashboard,
      queryKeys.memberships,
      queryKeys.balance,
      queryKeys.attendance,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  ).then(() => undefined);
