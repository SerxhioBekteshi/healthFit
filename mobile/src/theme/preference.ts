import { useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';
import { preferencesStore, type ThemePreference } from '@/storage/preferences';

export type { ThemePreference } from '@/storage/preferences';

let current: ThemePreference = 'system';
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): ThemePreference => current;

// Reads the choice saved on the phone; call it once before the first screen.
export const loadThemePreference = async (): Promise<void> => {
  const saved = await preferencesStore.loadTheme();
  if (saved && saved !== current) {
    current = saved;
    listeners.forEach((listener) => listener());
  }
};

export const setThemePreference = (preference: ThemePreference): void => {
  void preferencesStore.saveTheme(preference);
  if (preference === current) return;
  current = preference;
  listeners.forEach((listener) => listener());
};

// "system" follows the phone's light or dark setting.
export const useThemePreference = (): {
  preference: ThemePreference;
  isDark: boolean;
} => {
  const preference = useSyncExternalStore(subscribe, getSnapshot);
  const scheme = useColorScheme();
  return {
    preference,
    isDark: preference === 'system' ? scheme === 'dark' : preference === 'dark',
  };
};
