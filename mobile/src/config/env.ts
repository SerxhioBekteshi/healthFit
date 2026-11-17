import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 4000;

const withoutTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

// While developing, Expo knows the address of the computer that runs the bundler
// (for example "192.168.1.5:8081"). The API runs on that same computer.
const developmentHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? hostUri.split(':')[0] : null;
};

const resolveApiOrigin = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return withoutTrailingSlash(configured);
  // 10.0.2.2 is how the Android emulator reaches the computer it runs on.
  const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${developmentHost() ?? fallbackHost}:${API_PORT}`;
};

// Where the backend lives, without a path: `http://192.168.1.5:4000`.
export const API_ORIGIN = resolveApiOrigin();
