// Where a gym operates; decides the default language and currency.
export type CountryCode = 'AL' | 'GB' | 'IT' | 'DE' | 'GR';

export interface Gym {
  id: string;
  name: string;
  location: string;
  country: CountryCode;
  businessHours: string;
  opensAt: string;
  closesAt: string;
  timezone: string;
  adminEmails: string[];
  isActive: boolean;
  logoUrl: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  subdomain: string;
  customDomain: string;
  createdAt: string;
  updatedAt: string;
}
