import React, { useEffect, useState } from 'react';
import { fieldInputClass } from '@/components/common/FormField';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { t } from '@/i18n';
import type { SignupRequest } from '@gym/shared/types';

interface RejectRequestModalProps {
  request: SignupRequest | null;
  isPending: boolean;
  onClose: () => void;
  onReject: (note: string) => void;
}

// The note is only for the platform owner's records; the applicant is not emailed.
export const RejectRequestModal: React.FC<RejectRequestModalProps> = ({
  request,
  isPending,
  onClose,
  onReject,
}) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (request) setNote('');
  }, [request]);

  return (
    <Modal
      isOpen={request !== null}
      size="md"
      title={t('Reject this request?')}
      description={
        request
          ? t('{{name}} will not get an account for {{gym}}.', {
              name: request.ownerName,
              gym: request.gymName,
            })
          : undefined
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            variant="danger"
            loading={isPending}
            onClick={() => onReject(note.trim())}
          >
            {t('Reject')}
          </Button>
        </>
      }
    >
      <label
        htmlFor="reject-note"
        className="mb-1.5 block text-sm font-medium text-bone/70"
      >
        {t('Reason (optional)')}
      </label>
      <textarea
        id="reject-note"
        rows={3}
        maxLength={500}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className={fieldInputClass}
      />
    </Modal>
  );
};
