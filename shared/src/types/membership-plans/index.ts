import type { Gender } from '../clients';

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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
