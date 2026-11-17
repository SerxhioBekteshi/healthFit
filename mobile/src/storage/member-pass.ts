import * as SecureStore from 'expo-secure-store';

const PASS_KEY = 'member-pass';

// What the check-in QR needs. It is kept on the phone so the pass still opens
// at the gym door when there is no mobile data.
export interface MemberPass {
  clientId: string;
  fullName: string;
}

const isMemberPass = (value: unknown): value is MemberPass =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as MemberPass).clientId === 'string' &&
  typeof (value as MemberPass).fullName === 'string';

export const memberPassStore = {
  async load(): Promise<MemberPass | null> {
    const raw = await SecureStore.getItemAsync(PASS_KEY);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isMemberPass(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  async save(pass: MemberPass): Promise<void> {
    await SecureStore.setItemAsync(PASS_KEY, JSON.stringify(pass));
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(PASS_KEY);
  },
};
