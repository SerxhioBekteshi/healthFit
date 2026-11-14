import type { CountryCode, CurrencyCode } from '../gyms';

export type UserRole = 'super_admin' | 'gym_admin' | 'client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  gymId: string | null;
  // Country of the user's gym, which sets the default language; null for the platform owner.
  gymCountry: CountryCode | null;
  // Currency of the user's gym; the same for every user of it, whatever language they pick.
  gymCurrency: CurrencyCode | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
