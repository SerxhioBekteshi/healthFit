import type { CountryCode } from '../gyms';

export type SignupRequestStatus = 'pending' | 'approved' | 'rejected';

// A gym owner's application; the password hash is never part of it.
export interface SignupRequest {
  id: string;
  ownerName: string;
  email: string;
  phone: string;
  gymName: string;
  country: CountryCode;
  location: string;
  address: string;
  locationsCount: number;
  notes: string;
  status: SignupRequestStatus;
  reviewNote: string;
  reviewedAt: string | null;
  // The gym created on approval.
  gymId: string | null;
  createdAt: string;
}
