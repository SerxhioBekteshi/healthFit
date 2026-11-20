import type { CountryCode, CurrencyCode } from '../gyms';

// A gym a community member (a client without a gym yet) can look at and join.
export interface CommunityGym {
  id: string;
  name: string;
  location: string;
  country: CountryCode;
  currency: CurrencyCode;
  address: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: string;
  opensAt: string;
  closesAt: string;
  logoUrl: string;
}

export interface CommunityJoinResult {
  gymId: string;
  gymName: string;
}

export interface CommunityGyms {
  // The country the list is filtered by; null means every country.
  country: CountryCode | null;
  gyms: CommunityGym[];
}
