import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fieldInputClass } from '@/components/common/FormField';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { t } from '@/i18n';
import { formatDateTime } from '@/utils/format';
import type { ClientInvite } from '@gym/shared/types';

const COPIED_MS = 1500;

interface ClientInviteDialogProps {
  // The link is shown once; closing the dialog forgets the token.
  invite: ClientInvite | null;
  clientName: string;
  onClose: () => void;
}

export const inviteUrl = (token: string): string =>
  `${window.location.origin}/invite/${token}`;

export const ClientInviteDialog: React.FC<ClientInviteDialogProps> = ({
  invite,
  clientName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const url = invite ? inviteUrl(invite.token) : '';

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <Modal
      isOpen={invite !== null}
      size="md"
      title={t('Invite link for {{name}}', { name: clientName })}
      description={t(
        'Send this link or let them scan the QR code. They choose their own password, then sign in. It works once.'
      )}
      onClose={onClose}
      footer={<Button onClick={onClose}>{t('Done')}</Button>}
    >
      {invite ? (
        <div className="space-y-4">
          <div className="mx-auto grid w-fit place-items-center rounded-xl bg-white p-3">
            <QRCodeSVG value={url} size={160} />
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              aria-label={t('Invite link')}
              value={url}
              onFocus={(event) => event.target.select()}
              className={`${fieldInputClass} font-mono text-xs`}
            />
            <Button
              variant="secondary"
              icon={copied ? 'check' : undefined}
              onClick={() => void copy()}
            >
              {copied ? t('Copied') : t('Copy')}
            </Button>
          </div>
          <p className="text-xs text-bone/50">
            {t(
              'Expires {{date}}. Creating a new link cancels this one, and anyone with it can set the password, so share it only with the client.',
              { date: formatDateTime(invite.expiresAt) }
            )}
          </p>
        </div>
      ) : null}
    </Modal>
  );
};
