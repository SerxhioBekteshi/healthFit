import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { fieldInputClass } from '@/components/common/FormField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/hooks/confirm';
import { useGymJoinCode } from '@/hooks/client-signups';
import { t } from '@/i18n';

const COPIED_MS = 1500;

interface GymJoinDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const joinUrl = (joinCode: string): string =>
  `${window.location.origin}/join/${joinCode}`;

// The gym's permanent join link and QR: print it or share it, anyone can sign up as a member.
export const GymJoinDialog: React.FC<GymJoinDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { joinCode, isLoading, error, rotate } = useGymJoinCode(isOpen);
  const { confirm, dialog } = useConfirm();
  const [copied, setCopied] = useState(false);
  const url = joinCode ? joinUrl(joinCode) : '';

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  const askReplace = (): void =>
    confirm({
      title: t('Create a new join link?'),
      description: t(
        'The current link and QR code stop working. Print or share the new one instead.'
      ),
      confirmLabel: t('Create new link'),
      tone: 'warning',
      onConfirm: () => rotate.mutate(),
    });

  return (
    <>
      <Modal
        isOpen={isOpen}
        size="md"
        title={t('Join link for new members')}
        description={t(
          'Put this QR code at the front desk or send the link. Anyone who opens it can sign up as a member of your gym. It does not expire.'
        )}
        onClose={onClose}
        footer={<Button onClick={onClose}>{t('Done')}</Button>}
      >
        {error ? <Alert>{error.message}</Alert> : null}
        {isLoading ? <Skeleton className="h-52" /> : null}
        {joinCode ? (
          <div className="space-y-4">
            <div className="mx-auto grid w-fit place-items-center rounded-xl bg-white p-3">
              <QRCodeSVG value={url} size={176} />
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                aria-label={t('Join link')}
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
            <Button
              variant="secondary"
              disabled={rotate.isPending}
              onClick={askReplace}
            >
              {t('Create new link')}
            </Button>
          </div>
        ) : null}
      </Modal>
      {dialog}
    </>
  );
};
