import { useSyncExternalStore } from 'react';
import {
  getLanguage,
  getLocaleKey,
  setLanguage,
  subscribeLanguage,
  type Language,
} from '@/i18n';

// Re-renders the caller when the language changes; the provider also remounts the app on a change.
export const useLanguage = () => {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage);
  return {
    language,
    chooseLanguage: (next: Language): void =>
      setLanguage(next, { remember: true }),
  };
};

// Changes with the language and the currency; used as a React key to remount translated screens.
export const useLocaleKey = (): string =>
  useSyncExternalStore(subscribeLanguage, getLocaleKey);
