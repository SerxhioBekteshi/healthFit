// A tiny store so toasts can be raised from React Query caches, which live outside React.
export type ToastTone = 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const DURATION_MS: Record<ToastTone, number> = {
  success: 4000,
  error: 7000,
};
const MAX_VISIBLE = 4;

let toasts: readonly Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const publish = (next: readonly Toast[]): void => {
  toasts = next;
  listeners.forEach((listener) => listener());
};

const dismiss = (id: number): void => {
  publish(toasts.filter((item) => item.id !== id));
};

const push = (tone: ToastTone, message: string): void => {
  // The same message twice in a row would only stack up.
  if (toasts.some((item) => item.tone === tone && item.message === message)) {
    return;
  }
  const id = nextId++;
  publish([...toasts, { id, tone, message }].slice(-MAX_VISIBLE));
  window.setTimeout(() => dismiss(id), DURATION_MS[tone]);
};

export const toast = {
  success: (message: string): void => push('success', message),
  error: (message: string): void => push('error', message),
  dismiss,
};

export const subscribeToasts = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getToasts = (): readonly Toast[] => toasts;
