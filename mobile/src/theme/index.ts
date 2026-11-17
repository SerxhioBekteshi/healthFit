import { useMemo } from 'react';
import {
  darkColors,
  lightColors,
  radius,
  spacing,
  typography,
  type Colors,
} from './tokens';
import { useThemePreference } from './preference';

export interface Theme {
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
}

const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  isDark: false,
};

const darkTheme: Theme = { ...lightTheme, colors: darkColors, isDark: true };

// Follows the member's choice (light, dark or the phone's own setting).
export const useTheme = (): Theme =>
  useThemePreference().isDark ? darkTheme : lightTheme;

// Styles that depend on the theme. Pass a module-level factory so it is only rebuilt when the theme changes:
//   const createStyles = (theme: Theme) => StyleSheet.create({ ... });
//   const styles = useThemedStyles(createStyles);
export const useThemedStyles = <T>(factory: (theme: Theme) => T): T => {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
};

export type { Colors } from './tokens';
export type { TextVariant } from './tokens';
