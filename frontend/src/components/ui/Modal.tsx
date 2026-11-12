import React from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  size?: ModalSize;
  // Right-aligned action row, usually Buttons.
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

// The one centered dialog of the app: confirmations and short flows.
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  description,
  onClose,
  size = 'md',
  footer,
  children,
}) => (
  // The dialog renders in a portal outside .app-shell, so it re-applies the theme tokens.
  <Dialog open={isOpen} onClose={onClose} className="app-shell relative z-50">
    <DialogBackdrop
      transition
      className="fixed inset-0 bg-black/40 backdrop-blur-sm transition duration-200 ease-out data-[closed]:opacity-0"
    />
    <div className="fixed inset-0 grid place-items-center overflow-y-auto p-4">
      <DialogPanel
        transition
        className={`w-full ${sizes[size]} rounded-2xl border border-white/10 bg-graphite p-6 text-bone shadow-[0_30px_80px_var(--shadow)] transition duration-200 ease-out data-[closed]:translate-y-2 data-[closed]:scale-95 data-[closed]:opacity-0`}
      >
        <DialogTitle as="h2" className="text-lg font-semibold text-bone">
          {title}
        </DialogTitle>
        {description ? (
          <Description className="mt-1.5 text-sm text-bone/55">
            {description}
          </Description>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
        {footer ? (
          <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
        ) : null}
      </DialogPanel>
    </div>
  </Dialog>
);
