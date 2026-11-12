import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { t } from '@/i18n';
import type { Client } from '@gym/shared/types';
import { genderLabels } from '@/utils/constants/labels';
import { formatDateTime } from '@/utils/format';

interface ClientDetailsDrawerProps {
  client: Client | null;
  onClose: () => void;
}

const Detail: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="border-b border-white/[0.07] pb-4 last:border-b-0">
    <dt className="text-xs font-medium text-bone/45">{label}</dt>
    <dd className="mt-1.5 text-sm text-bone">{value}</dd>
  </div>
);

export const ClientDetailsDrawer: React.FC<ClientDetailsDrawerProps> = ({
  client,
  onClose,
}) => (
  <Drawer
    isOpen={client !== null}
    title={t('Client details')}
    description={t('Review member profile information.')}
    onClose={onClose}
    showSubmit={false}
    cancelLabel={t('Close')}
  >
    {client ? (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={client.fullName} size="lg" />
          <div>
            <p className="text-lg font-semibold text-bone">{client.fullName}</p>
            <div className="mt-1.5">
              <Badge tone={client.isActive ? 'success' : 'neutral'}>
                {client.isActive ? t('Active') : t('Inactive')}
              </Badge>
            </div>
          </div>
        </div>
        <dl className="grid gap-4">
          <Detail label={t('Email')} value={client.email} />
          <Detail label={t('Phone')} value={client.phone} />
          <Detail
            label={t('Gender')}
            value={client.gender ? genderLabels[client.gender] : t('Not set')}
          />
          <Detail
            label={t('Created')}
            value={formatDateTime(client.createdAt)}
          />
          <Detail
            label={t('Last updated')}
            value={formatDateTime(client.updatedAt)}
          />
        </dl>
      </div>
    ) : null}
  </Drawer>
);
