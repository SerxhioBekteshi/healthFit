import React, { useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';
import {
  getToasts,
  subscribeToasts,
  toast,
  type ToastTone,
} from '@/utils/toast';

const tones: Record<ToastTone, { border: string; icon: string }> = {
  success: { border: 'border-signal/40', icon: 'text-signal' },
  error: { border: 'border-danger/40', icon: 'text-danger' },
};

// Mounted once at the root; every success or failure of an API call shows up here.
export const Toaster: React.FC = () => {
  const items = useSyncExternalStore(subscribeToasts, getToasts);

  return (
    // `app-shell` gives the toasts the app palette, including the light theme.
    <div
      aria-live="polite"
      className="app-shell pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-lg border bg-panel px-4 py-3 text-sm text-bone shadow-lg motion-reduce:animate-none ${tones[item.tone].border}`}
        >
          <Icon
            name={item.tone === 'success' ? 'check' : 'alert'}
            className={`mt-0.5 h-4 w-4 shrink-0 ${tones[item.tone].icon}`}
          />
          <p className="min-w-0 flex-1 break-words">{item.message}</p>
          <button
            type="button"
            aria-label={t('Dismiss')}
            onClick={() => toast.dismiss(item.id)}
            className="shrink-0 text-bone/45 transition-colors hover:text-bone"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
