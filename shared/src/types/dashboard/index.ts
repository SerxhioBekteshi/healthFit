import type { AttendanceStats } from '../attendance';
import type { MembershipPlanType } from '../membership-plans';

export interface GymDashboard {
  gymName: string;
  totalClients: number;
  activeClients: number;
  activeMemberships: number;
  expiringSoon: number;
  pendingPayments: number;
  lowStockProducts: number;
  revenueThisMonth: number;
  attendance: AttendanceStats;
  // Distinct members with a check-in per gym-local day, last 7 days, today last.
  visitsByDay: { date: string; count: number }[];
  // Active memberships ending within 7 days, soonest first.
  expiringMemberships: {
    clientName: string;
    planName: string;
    endDate: string;
  }[];
  recentCheckIns: { clientName: string; checkedInAt: string }[];
}

export interface ClientWeek {
  // Monday of the current week and today, as gym-local dates (YYYY-MM-DD).
  start: string;
  today: string;
  // Days of this week with a check-in.
  checkedInDates: string[];
  // Distinct days with a check-in in the previous Monday-to-Sunday week.
  previousVisits: number;
}

export interface ClientDashboard {
  clientId: string;
  fullName: string;
  activeMembership: {
    planName: string;
    planType: MembershipPlanType;
    endDate: string;
    visitsRemaining: number;
    weeklyVisits: number;
    // Amount paid for this membership.
    price: number;
    // Visits the plan allows in the current 4-week period; 0 when there is no weekly limit.
    visitsAllowed: number;
    // Check-ins made in that period.
    visitsUsed: number;
    // End of the last full 4 weeks of a weekly plan (leftover days are not counted); else `endDate`.
    visitsEndDate: string;
  } | null;
  balance: number;
  attendance: { total: number; last7Days: number; last30Days: number };
  week: ClientWeek;
  currentlyInside: number;
}

export interface PlatformDashboard {
  totalGyms: number;
  activeGyms: number;
  inactiveGyms: number;
  totalClients: number;
  activeMemberships: number;
  checkInsLast24h: number;
  totalPrograms: number;
  subscriptions: {
    trialing: number;
    active: number;
    pastDue: number;
    cancelled: number;
  };
  revenueTotal: number;
  revenueThisMonth: number;
  overdueAmount: number;
}
