export interface Locker {
  id: string;
  locationId: string;
  locationName: string;
  number: string;
  // Out of service when false.
  isActive: boolean;
  // The member whose open visit holds the locker; null when it is free.
  occupiedBy: { clientId: string; clientName: string; since: string } | null;
}

// The locker a member put their things in.
export interface LockerAssignment {
  lockerNumber: string;
  locationName: string | null;
  clientName: string;
}
