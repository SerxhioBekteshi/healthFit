import React, { useCallback, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  // Runs after the user confirms.
  onConfirm: () => void;
}

// `confirm(request)` opens the dialog; render `dialog` once in the page.
export const useConfirm = (): {
  confirm: (request: ConfirmRequest) => void;
  dialog: React.ReactNode;
} => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const close = useCallback(() => setRequest(null), []);

  const dialog = (
    <ConfirmDialog
      isOpen={request !== null}
      title={request?.title ?? ''}
      description={request?.description}
      confirmLabel={request?.confirmLabel}
      cancelLabel={request?.cancelLabel}
      tone={request?.tone}
      onClose={close}
      onConfirm={() => {
        request?.onConfirm();
        close();
      }}
    />
  );

  return { confirm: setRequest, dialog };
};
