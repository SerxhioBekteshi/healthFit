import React from 'react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { msg, t, translated } from '@/i18n';
import { countryNames } from '@/utils/constants/countries';
import { formatDateTime } from '@/utils/format';
import type { SignupRequest, SignupRequestStatus } from '@gym/shared/types';

export const requestStatusLabels = translated<SignupRequestStatus>({
  pending: msg('Pending'),
  approved: msg('Approved'),
  rejected: msg('Rejected'),
});

export const requestStatusTone: Record<SignupRequestStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const Detail: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="border-b border-white/[0.07] pb-4 last:border-b-0">
    <dt className="text-xs font-medium text-bone/45">{label}</dt>
    <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm text-bone">
      {value || '—'}
    </dd>
  </div>
);

interface SignupRequestDetailsDrawerProps {
  request: SignupRequest | null;
  onClose: () => void;
}

export const SignupRequestDetailsDrawer: React.FC<
  SignupRequestDetailsDrawerProps
> = ({ request, onClose }) => (
  <Drawer
    isOpen={request !== null}
    title={t('Request details')}
    description={t('Check the details before you decide.')}
    onClose={onClose}
    showSubmit={false}
    cancelLabel={t('Close')}
  >
    {request ? (
      <div className="space-y-6">
        <Badge tone={requestStatusTone[request.status]}>
          {requestStatusLabels[request.status]}
        </Badge>
        <dl className="grid gap-4">
          <Detail label={t('Full Name')} value={request.ownerName} />
          <Detail label={t('Email')} value={request.email} />
          <Detail label={t('Phone')} value={request.phone} />
          <Detail label={t('Gym Name')} value={request.gymName} />
          <Detail label={t('Country')} value={countryNames[request.country]} />
          <Detail label={t('City')} value={request.location} />
          <Detail label={t('Address')} value={request.address} />
          <Detail
            label={t('Number of locations')}
            value={String(request.locationsCount)}
          />
          <Detail label={t('Notes')} value={request.notes} />
          <Detail
            label={t('Submitted')}
            value={formatDateTime(request.createdAt)}
          />
          {request.reviewedAt ? (
            <Detail
              label={t('Reviewed')}
              value={formatDateTime(request.reviewedAt)}
            />
          ) : null}
          {request.status === 'rejected' ? (
            <Detail label={t('Reason')} value={request.reviewNote} />
          ) : null}
        </dl>
      </div>
    ) : null}
  </Drawer>
);
