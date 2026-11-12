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
