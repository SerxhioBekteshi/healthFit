export type GymSubscriptionCycle = 'monthly' | 'yearly';

export type GymSubscriptionStatus =
  'trialing' | 'active' | 'past_due' | 'cancelled';

export interface GymSubscription {
  id: string;
  gymId: string;
  gymName: string;
  planName: string;
  cycle: GymSubscriptionCycle;
  price: number;
  status: GymSubscriptionStatus;
  startDate: string;
  currentPeriodEnd: string;
  nextPaymentDue: string;
  createdAt: string;
  updatedAt: string;
}

export interface GymSubscriptionPayment {
  id: string;
  subscriptionId: string;
  gymId: string;
  gymName: string;
  planName: string;
  amount: number;
  paymentMethod: 'card' | 'bank_transfer' | 'online';
  paidAt: string;
  providerReference: string;
}
