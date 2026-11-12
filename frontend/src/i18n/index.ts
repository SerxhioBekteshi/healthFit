import i18next from 'i18next';
import { de } from './locales/de';
import { el } from './locales/el';
import { it } from './locales/it';
import { sq } from './locales/sq';

export const LANGUAGES = ['en', 'sq', 'it', 'de', 'el'] as const;
export type Language = (typeof LANGUAGES)[number];

// Each language in its own words, so a speaker can find it in any language.
export const languageNames: Record<Language, string> = {
  en: 'English',
  sq: 'Shqip',
  it: 'Italiano',
  de: 'Deutsch',
  el: 'Ελληνικά',
};

// Locale used for dates and numbers.
export const intlLocales: Record<Language, string> = {
  en: 'en-GB',
  sq: 'sq-AL',
  it: 'it-IT',
  de: 'de-DE',
  el: 'el-GR',
};

const STORAGE_KEY = 'language';

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((language) => language === value);

const detectLanguage = (): Language => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLanguage(stored)) return stored;
  const browser = navigator.language.slice(0, 2).toLowerCase();
  return isLanguage(browser) ? browser : 'en';
};

let current: Language = detectLanguage();
const listeners = new Set<() => void>();

// The English text is the key, so English needs no dictionary and a missing translation shows English.
void i18next.init({
  lng: current,
  fallbackLng: 'en',
  initAsync: false,
  keySeparator: false,
  nsSeparator: false,
  returnNull: false,
  interpolation: { escapeValue: false },
  resources: {
    sq: { translation: sq },
    it: { translation: it },
    de: { translation: de },
    el: { translation: el },
  },
});
document.documentElement.lang = current;

// Texts are free English strings, not typed resource keys.
const translate = i18next.t.bind(i18next) as unknown as (
  text: string,
  options?: Record<string, unknown>
) => string;

// Translates an English message now; use it inside components and handlers.
export const t = (text: string, options?: Record<string, unknown>): string =>
  translate(text, options);

// Marks English text for translation where it is declared (constants, option lists) and returns
// it unchanged; translate it where it is shown with `t(value)`. The extractor reads both.
export const msg = (text: string): string => text;

// Label maps whose values are `msg(...)` texts and translate each time they are read.
export const translated = <K extends string>(
  labels: Record<K, string>
): Record<K, string> => {
  const result = {} as Record<K, string>;
  for (const key of Object.keys(labels) as K[]) {
    Object.defineProperty(result, key, {
      enumerable: true,
      get: () => t(labels[key]),
    });
  }
  return result;
};

export const getLanguage = (): Language => current;

// Money keeps its stored number; only the symbol and format follow the gym's country.
export type CurrencyCode = 'ALL' | 'EUR' | 'GBP';

let currentCurrency: CurrencyCode = 'ALL';

export const getCurrency = (): CurrencyCode => currentCurrency;

export const setCurrency = (currency: CurrencyCode): void => {
  if (currency === currentCurrency) return;
  currentCurrency = currency;
  listeners.forEach((listener) => listener());
};

// Changes whenever the language or the currency does, so a provider can remount the app on it.
export const getLocaleKey = (): string => `${current}:${currentCurrency}`;

export const subscribeLanguage = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// `remember` keeps an explicit choice on this device; a default taken from the gym's country is not kept.
export const setLanguage = (
  language: Language,
  options: { remember?: boolean } = {}
): void => {
  if (options.remember) {
    window.localStorage.setItem(STORAGE_KEY, language);
  }
  if (language === current) return;
  current = language;
  document.documentElement.lang = language;
  void i18next.changeLanguage(language).then(() => {
    listeners.forEach((listener) => listener());
  });
};

export const hasChosenLanguage = (): boolean =>
  isLanguage(window.localStorage.getItem(STORAGE_KEY));
