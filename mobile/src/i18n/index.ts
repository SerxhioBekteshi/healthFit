import { useSyncExternalStore } from 'react';
import type { CountryCode } from '@gym/shared/types';
import { preferencesStore } from '@/storage/preferences';
import { de } from '@gym/shared/i18n/de';
import { el } from '@gym/shared/i18n/el';
import { it } from '@gym/shared/i18n/it';
import { sq } from '@gym/shared/i18n/sq';

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

// The gym's country sets the starting language, like on the web.
export const countryLanguages: Record<CountryCode, Language> = {
  AL: 'sq',
  GB: 'en',
  IT: 'it',
  DE: 'de',
  GR: 'el',
};

// The English text is the key: English needs no dictionary and a missing translation shows English.
const dictionaries: Record<Language, Record<string, string>> = {
  en: {},
  sq,
  it,
  de,
  el,
};

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((language) => language === value);

let current: Language = 'en';
let chosen = false;
const listeners = new Set<() => void>();

const notify = (): void => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getLanguage = (): Language => current;

// Translates an English text now; `{{name}}` placeholders are filled from `values`.
export const t = (
  text: string,
  values?: Record<string, string | number>
): string => {
  const translated = dictionaries[current][text] ?? text;
  if (!values) return translated;
  return translated.replace(/{{(\w+)}}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  );
};

// Marks English text for translation where it is declared (constants, option lists) and returns it unchanged;
// translate it where it is shown with `t(value)`. The extractor reads both.
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

// Reads the language saved on the phone; call it once before the first screen.
export const loadLanguage = async (): Promise<void> => {
  const saved = await preferencesStore.loadLanguage();
  if (isLanguage(saved)) {
    current = saved;
    chosen = true;
    notify();
  }
};

// `remember` keeps an explicit choice on this phone; a default taken from the gym's country is not kept.
export const setLanguage = (
  language: Language,
  options: { remember?: boolean } = {}
): void => {
  if (options.remember) {
    chosen = true;
    void preferencesStore.saveLanguage(language);
  }
  if (language === current) return;
  current = language;
  notify();
};

// An explicit choice wins over the country default.
export const applyCountryLanguage = (country: CountryCode): void => {
  if (!chosen) setLanguage(countryLanguages[country]);
};

// Components that show text call this so they redraw when the language changes.
export const useTranslation = (): { t: typeof t; language: Language } => {
  const language = useSyncExternalStore(subscribe, getLanguage);
  return { t, language };
};
