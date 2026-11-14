import React, { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useConfirm } from '@/hooks/confirm';
import { useSignupRequests } from '@/hooks/signup-requests';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { countryNames } from '@/utils/constants/countries';
import { formatDate } from '@/utils/format';
import type { SignupRequest, SignupRequestStatus } from '@gym/shared/types';
import { RejectRequestModal } from './RejectRequestModal';
import {
  SignupRequestDetailsDrawer,
  requestStatusLabels,
  requestStatusTone,
} from './SignupRequestDetailsDrawer';

type StatusFilter = SignupRequestStatus | 'all';

export const SignupRequestsPage: React.FC = () => {
  const { requests, isLoading, error, approveRequest, rejectRequest } =
    useSignupRequests();
  const { confirm, dialog } = useConfirm();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [viewing, setViewing] = useState<SignupRequest | null>(null);
  const [rejecting, setRejecting] = useState<SignupRequest | null>(null);

  const countOf = (value: SignupRequestStatus): number =>
    requests.filter((request) => request.status === value).length;

  const askApprove = (request: SignupRequest): void =>
    confirm({
      title: t('Approve {{gym}}?', { gym: request.gymName }),
      description: t(
        'This creates the gym and an admin account for {{name}} ({{email}}). They can sign in right away with the password they chose.',
        { name: request.ownerName, email: request.email }
      ),
      confirmLabel: t('Approve'),
      tone: 'primary',
      onConfirm: () => approveRequest.mutate(request.id),
    });

  const onReject = (note: string): void => {
    if (!rejecting) return;
    rejectRequest.mutate(
      { id: rejecting.id, input: { note } },
      { onSettled: () => setRejecting(null) }
    );
  };

  const columns: Column<SignupRequest>[] = [
    {
      key: 'applicant',
      header: t('Applicant'),
      primary: true,
      sortValue: (item) => item.ownerName,
      searchValue: (item) => `${item.ownerName} ${item.email} ${item.phone}`,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.ownerName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-bone">{item.ownerName}</p>
            <p className="truncate text-xs text-bone/45">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'gym',
      header: t('Gym'),
      sortValue: (item) => item.gymName,
      searchValue: (item) => `${item.gymName} ${item.location}`,
      cell: (item) => (
        <div>
          <p className="font-semibold text-bone">{item.gymName}</p>
          <p className="text-xs text-bone/45">{item.location}</p>
        </div>
      ),
    },
    {
      key: 'country',
      header: t('Country'),
      sortValue: (item) => countryNames[item.country],
      searchValue: (item) => countryNames[item.country],
      cell: (item) => countryNames[item.country],
    },
    {
      key: 'locations',
      header: t('Locations'),
      sortValue: (item) => item.locationsCount,
      searchValue: (item) => String(item.locationsCount),
      cell: (item) => item.locationsCount,
    },
    {
      key: 'submitted',
      header: t('Submitted'),
      sortValue: (item) => item.createdAt,
      searchValue: (item) => formatDate(item.createdAt),
      cell: (item) => (
        <span className="tabular-nums">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      sortValue: (item) => item.status,
      searchValue: (item) => requestStatusLabels[item.status],
      cell: (item) => (
        <Badge tone={requestStatusTone[item.status]}>
          {requestStatusLabels[item.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (item) => (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon="eye"
            onClick={() => setViewing(item)}
          >
            {t('View details')}
          </Button>
          {item.status === 'pending' ? (
            <>
              <Button
                size="sm"
                variant="success"
                icon="check"
                disabled={approveRequest.isPending}
                onClick={() => askApprove(item)}
              >
                {t('Approve')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon="x"
                onClick={() => setRejecting(item)}
              >
                {t('Reject')}
              </Button>
            </>
          ) : null}
        </>
      ),
    },
  ];

  const table = useTableController({
    rows: requests,
    columns,
    filter: (request) => status === 'all' || request.status === status,
  });

  return (
    <>
      <PageHeader
        title={t('Requests')}
        accent={t('from gym owners')}
        description={t(
          'Owners who asked to join the platform. Check them, then approve or reject.'
        )}
      />

      {approveRequest.error ? (
        <Alert className="mb-4">{approveRequest.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(request) => request.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search by name, email or gym')}
        toolbar={
          <FilterSelect
            label={t('Filter by status')}
            value={status}
            onChange={(value) => {
              setStatus(value);
              table.setPage(0);
            }}
            options={[
              {
                value: 'pending',
                label: requestStatusLabels.pending,
                count: countOf('pending'),
              },
              {
                value: 'approved',
                label: requestStatusLabels.approved,
                count: countOf('approved'),
              },
              {
                value: 'rejected',
                label: requestStatusLabels.rejected,
                count: countOf('rejected'),
              },
              { value: 'all', label: t('All'), count: requests.length },
            ]}
          />
        }
        emptyTitle={
          requests.length === 0 ? t('No requests yet') : t('No matches')
        }
        emptyHint={
          requests.length === 0
            ? t('Gym owners who register from the landing page show up here.')
            : t('Try a different search or filter.')
        }
      />

      <SignupRequestDetailsDrawer
        request={viewing}
        onClose={() => setViewing(null)}
      />
      <RejectRequestModal
        request={rejecting}
        isPending={rejectRequest.isPending}
        onClose={() => setRejecting(null)}
        onReject={onReject}
      />
      {dialog}
    </>
  );
};
