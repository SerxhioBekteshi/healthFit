import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth-token';

// The session token lives in the phone's secure storage (Keychain on iOS, Keystore on Android).
// It is mirrored in memory so the API client can read it without waiting.
let cached: string | null = null;

export const tokenStore = {
  async load(): Promise<string | null> {
    cached = await SecureStore.getItemAsync(TOKEN_KEY);
    return cached;
  },
  get(): string | null {
    return cached;
  },
  async set(token: string): Promise<void> {
    cached = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    cached = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
