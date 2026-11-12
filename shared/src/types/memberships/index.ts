import type { MembershipPlanType } from '../membership-plans';
import type { PaymentMethod } from '../payments';

// `upcoming` is derived: paid and queued, not started yet.
export type MembershipStatus =
  'pending' | 'active' | 'upcoming' | 'expired' | 'cancelled';

export type MembershipPaymentStatus = 'paid' | 'pending' | 'failed';

export interface Membership {
  id: string;
  gymId: string;
  clientId: string;
  planId: string;
  planName: string;
  planType: MembershipPlanType;
  weeklyVisits: number;
  startDate: string;
  endDate: string;
  price: number;
  paymentMethod: PaymentMethod;
  paymentStatus: MembershipPaymentStatus;
  paymentReference: string;
  status: MembershipStatus;
  visitsRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipHistoryPage {
  memberships: Membership[];
  // Pass it as `cursor` to load the next, older page; null on the last page.
  nextCursor: string | null;
}

// `from`/`to` (YYYY-MM-DD, inclusive) match memberships whose period overlaps that range.
export interface MembershipHistoryFilters {
  status?: MembershipStatus;
  from?: string;
  to?: string;
}
