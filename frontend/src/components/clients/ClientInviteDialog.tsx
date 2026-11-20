import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useSendClientInviteEmail } from '@/hooks/client-invites';
import { t } from '@/i18n';
import { formatDateTime } from '@/utils/format';
import type { ClientInvite } from '@gym/shared/types';

const COPIED_MS = 1500;

interface ClientInviteDialogProps {
  // The link is shown once; closing the dialog forgets the token.
  invite: ClientInvite | null;
  clientId: string;
  clientName: string;
  clientEmail: string;
  onClose: () => void;
}

export const inviteUrl = (token: string): string =>
  `${window.location.origin}/invite/${token}`;

export const ClientInviteDialog: React.FC<ClientInviteDialogProps> = ({
  invite,
  clientId,
  clientName,
  clientEmail,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const sendEmail = useSendClientInviteEmail();
  const { reset: resetSend } = sendEmail;
  const url = invite ? inviteUrl(invite.token) : '';

  // A new link (another client, or a new one for the same client) starts without a "sent" state.
  useEffect(() => {
    resetSend();
  }, [invite?.token, resetSend]);

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
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
            <p className="min-w-0 text-sm text-bone/70">
              {sendEmail.isSuccess
                ? t('Sent to {{email}}.', { email: clientEmail })
                : t('Or send the link to {{email}}.', { email: clientEmail })}
            </p>
            <Button
              variant="secondary"
              icon={sendEmail.isSuccess ? 'check' : undefined}
              loading={sendEmail.isPending}
              onClick={() =>
                sendEmail.mutate({ clientId, token: invite.token })
              }
            >
              {sendEmail.isSuccess ? t('Send again') : t('Send by email')}
            </Button>
          </div>
          {sendEmail.error ? <Alert>{sendEmail.error.message}</Alert> : null}
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
