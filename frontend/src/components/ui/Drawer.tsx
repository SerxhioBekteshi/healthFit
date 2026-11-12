import React from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';

type DrawerSize = 'md' | 'lg' | 'xl';

interface DrawerProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  size?: DrawerSize;
  children: React.ReactNode;
  // Footer: Cancel closes the drawer unless `onCancel` is given.
  onCancel?: () => void;
  onSubmitClick?: () => void;
  showCancel?: boolean;
  showSubmit?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  serverError?: string | null;
}

const sizes: Record<DrawerSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// The one side panel of the app. Domain drawers live next to the page that opens them.
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  title,
  description,
  onClose,
  size = 'md',
  children,
  onCancel,
  onSubmitClick,
  showCancel = true,
  showSubmit = true,
  submitLabel = t('Save'),
  cancelLabel = t('Cancel'),
  isPending = false,
  serverError,
}) => (
  // The dialog renders in a portal outside .app-shell, so it re-applies the theme tokens.
  <Dialog open={isOpen} onClose={onClose} className="app-shell relative z-50">
    <DialogBackdrop
      transition
      className="fixed inset-0 bg-black/40 backdrop-blur-sm transition duration-300 ease-out data-[closed]:opacity-0"
    />
    <DialogPanel
      transition
      className={`fixed inset-y-0 right-0 flex w-full ${sizes[size]} flex-col border-l border-white/10 bg-graphite text-bone shadow-[-30px_0_80px_var(--shadow)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[closed]:translate-x-full`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-6 sm:px-8">
        <div>
          <DialogTitle as="h2" className="text-lg font-semibold text-bone">
            {title}
          </DialogTitle>
          {description ? (
            <Description className="mt-1.5 text-sm text-bone/55">
              {description}
            </Description>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Close')}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 text-bone/70 transition hover:border-white/40 hover:text-bone"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
      {showCancel || showSubmit ? (
        <div className="space-y-3 border-t border-white/10 px-6 py-4 sm:px-8">
          {serverError ? <Alert>{serverError}</Alert> : null}
          <div className="flex items-center gap-3">
            {showCancel ? (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onCancel ?? onClose}
              >
                {cancelLabel}
              </Button>
            ) : null}
            {showSubmit ? (
              <Button
                className="flex-1"
                loading={isPending}
                onClick={onSubmitClick}
              >
                {isPending ? t('Saving') : submitLabel}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </DialogPanel>
  </Dialog>
);
