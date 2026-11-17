export interface AttendanceRecord {
  id: string;
  gymId: string;
  clientId: string;
  clientName: string;
  membershipId: string;
  // The gym location where the member trained; null for check-ins from before locations.
  locationId: string | null;
  locationName: string | null;
  checkedInAt: string;
  checkedOutAt: string | null;
  // Locker the member used during the visit; null when none.
  lockerNumber: string | null;
}

export interface ScanResult {
  // A scan checks a member in, or out when they are already inside.
  action: 'checked_in' | 'checked_out';
  record: AttendanceRecord;
}

export interface AttendanceHistoryPage {
  records: AttendanceRecord[];
  // Pass it as `cursor` to load the next, older page; null on the last page.
  nextCursor: string | null;
}

export interface AttendanceStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  currentlyInside: number;
}

// The gym-local days (YYYY-MM-DD) of one month (YYYY-MM) on which the member checked in, oldest first.
export interface AttendanceDays {
  month: string;
  days: string[];
}
