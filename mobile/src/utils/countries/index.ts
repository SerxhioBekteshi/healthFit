import { msg, translated } from '@/i18n';
import type { CountryCode } from '@gym/shared/types';
import { COUNTRY_CODES } from '@gym/shared/validation/gyms';

export const countryNames = translated<CountryCode>({
  AL: msg('Albania'),
  GB: msg('United Kingdom'),
  IT: msg('Italy'),
  DE: msg('Germany'),
  GR: msg('Greece'),
});

export const countryCodes: readonly CountryCode[] = COUNTRY_CODES;
