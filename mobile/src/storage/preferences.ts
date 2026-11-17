import * as SecureStore from 'expo-secure-store';

export type ThemePreference = 'system' | 'light' | 'dark';

const LANGUAGE_KEY = 'language';
const THEME_KEY = 'theme';

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

// The member's own choices, kept on the phone. `null` means nothing was chosen yet.
export const preferencesStore = {
  loadLanguage: (): Promise<string | null> =>
    SecureStore.getItemAsync(LANGUAGE_KEY),
  saveLanguage: (language: string): Promise<void> =>
    SecureStore.setItemAsync(LANGUAGE_KEY, language),
  async loadTheme(): Promise<ThemePreference | null> {
    const value = await SecureStore.getItemAsync(THEME_KEY);
    return isThemePreference(value) ? value : null;
  },
  saveTheme: (theme: ThemePreference): Promise<void> =>
    SecureStore.setItemAsync(THEME_KEY, theme),
};
