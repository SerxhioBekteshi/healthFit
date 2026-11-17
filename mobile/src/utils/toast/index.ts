export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (toast: ToastMessage) => void;

// A toast that was shown less than this long ago is still on screen.
const STILL_VISIBLE_MS = 3500;

// Hosts show toasts. A modal opens its own host, so only the most recent one receives them:
// that keeps a toast visible above whatever is on screen.
const hosts: Listener[] = [];
let nextId = 1;
let recent: { toast: ToastMessage; host?: Listener; shownAt: number } | null =
  null;

const show = (kind: ToastKind, message: string): void => {
  const toast: ToastMessage = { id: nextId++, kind, message };
  const host = hosts[hosts.length - 1];
  recent = { toast, host, shownAt: Date.now() };
  host?.(toast);
};

export const toast = {
  success: (message: string): void => show('success', message),
  error: (message: string): void => show('error', message),
  info: (message: string): void => show('info', message),
  // Returns the function that removes the host again.
  register(listener: Listener): () => void {
    hosts.push(listener);
    return () => {
      const index = hosts.indexOf(listener);
      if (index >= 0) hosts.splice(index, 1);
      // A sheet closes right after a payment succeeds: hand its toast to the host below,
      // otherwise the result would vanish with the sheet.
      if (
        recent?.host === listener &&
        Date.now() - recent.shownAt < STILL_VISIBLE_MS
      ) {
        hosts[hosts.length - 1]?.(recent.toast);
      }
    };
  },
};
