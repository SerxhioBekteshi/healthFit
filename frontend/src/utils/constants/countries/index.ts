import type { CountryCode } from '@gym/shared/types';
import { msg, translated, type CurrencyCode, type Language } from '@/i18n';

interface CountryConfig {
  language: Language;
  currency: CurrencyCode;
  // Starting timezone when a gym is created in the country.
  timezone: string;
}

export const countryConfig: Record<CountryCode, CountryConfig> = {
  AL: { language: 'sq', currency: 'ALL', timezone: 'Europe/Tirane' },
  GB: { language: 'en', currency: 'GBP', timezone: 'Europe/London' },
  IT: { language: 'it', currency: 'EUR', timezone: 'Europe/Rome' },
  DE: { language: 'de', currency: 'EUR', timezone: 'Europe/Berlin' },
  GR: { language: 'el', currency: 'EUR', timezone: 'Europe/Athens' },
};

export const countryNames = translated<CountryCode>({
  AL: msg('Albania'),
  GB: msg('United Kingdom'),
  IT: msg('Italy'),
  DE: msg('Germany'),
  GR: msg('Greece'),
});
