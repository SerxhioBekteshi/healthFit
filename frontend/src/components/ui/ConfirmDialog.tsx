import React from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { t } from '@/i18n';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Asks before doing something that is hard to undo.
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = t('Confirm'),
  cancelLabel = t('Cancel'),
  tone = 'danger',
  isPending = false,
  onConfirm,
  onClose,
}) => (
  <Modal
    isOpen={isOpen}
    size="sm"
    title={title}
    description={description}
    onClose={onClose}
    footer={
      <>
        <Button variant="ghost" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={tone} loading={isPending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  />
);
