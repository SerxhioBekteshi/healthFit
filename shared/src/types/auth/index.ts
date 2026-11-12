import type { CountryCode } from '../gyms';

export type UserRole = 'super_admin' | 'gym_admin' | 'client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  gymId: string | null;
  // Country of the user's gym, which sets the default language and currency; null for the platform owner.
  gymCountry: CountryCode | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
