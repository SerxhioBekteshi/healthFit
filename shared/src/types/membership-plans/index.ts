import type { Gender } from '../clients';
import type { PlanOffer } from '../price-offers';

export type MembershipPlanType =
  | 'monthly'
  | 'three_months'
  | 'six_months'
  | 'yearly'
  | 'visit_based'
  | 'personal_training';

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  type: MembershipPlanType;
  durationDays: number;
  visitCount: number;
  gender: Gender;
  // Check-ins allowed per week; 0 means no weekly cap.
  weeklyVisits: number;
  price: number;
  // Limited-time price in force today, if any; it is what a purchase costs. `price` stays the regular one.
  offer: PlanOffer | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
