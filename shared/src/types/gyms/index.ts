// Where a gym operates; decides the default language and, with it, the gym's currency.
export type CountryCode = 'AL' | 'GB' | 'IT' | 'DE' | 'GR';

// The money of a gym: Albanian lek, euro or pound. Amounts are never converted between them.
export type CurrencyCode = 'ALL' | 'EUR' | 'GBP';

export interface Gym {
  id: string;
  name: string;
  location: string;
  country: CountryCode;
  // Set from the country when the gym opens and never changes with a member's language.
  currency: CurrencyCode;
  // True once the gym has prices or payments; its country (and currency) can no longer change.
  countryLocked: boolean;
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
