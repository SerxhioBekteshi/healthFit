import type { CountryCode, CurrencyCode } from '@gym/shared/types';
import { COUNTRY_TIMEZONES } from '@gym/shared/validation/gyms';
import { msg, translated, type Language } from '@/i18n';

interface CountryConfig {
  language: Language;
  // Starting timezone when a gym is created in the country.
  timezone: string;
}

export const countryConfig: Record<CountryCode, CountryConfig> = {
  AL: { language: 'sq', timezone: COUNTRY_TIMEZONES.AL },
  GB: { language: 'en', timezone: COUNTRY_TIMEZONES.GB },
  IT: { language: 'it', timezone: COUNTRY_TIMEZONES.IT },
  DE: { language: 'de', timezone: COUNTRY_TIMEZONES.DE },
  GR: { language: 'el', timezone: COUNTRY_TIMEZONES.GR },
};

export const countryNames = translated<CountryCode>({
  AL: msg('Albania'),
  GB: msg('United Kingdom'),
  IT: msg('Italy'),
  DE: msg('Germany'),
  GR: msg('Greece'),
});

export const currencyNames = translated<CurrencyCode>({
  ALL: msg('Albanian lek (ALL)'),
  EUR: msg('Euro (EUR)'),
  GBP: msg('Pound sterling (GBP)'),
});
