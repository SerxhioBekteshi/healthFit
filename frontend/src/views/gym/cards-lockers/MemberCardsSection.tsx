import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { useAccessSettings } from '@/hooks/access-settings';
import { useClients } from '@/hooks/clients';
import { useConfirm } from '@/hooks/confirm';
import { useMemberCards } from '@/hooks/member-cards';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { formatDate } from '@/utils/format';
import type { MemberCard } from '@gym/shared/types';
import type { IssueCardValues } from '@gym/shared/validation/member-cards';
import { MemberCardFormDrawer } from './MemberCardFormDrawer';

// Member cards: issue, block and unblock. One tab of the Cards & lockers page.
export const MemberCardsSection: React.FC = () => {
  const { cards, isLoading, error, issueCard, setCardActive } =
    useMemberCards();
  const { clients } = useClients();
  const { settings } = useAccessSettings();
  const { confirm, dialog } = useConfirm();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (): void => {
    issueCard.reset();
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: IssueCardValues): Promise<void> => {
    try {
      await issueCard.mutateAsync(values);
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<MemberCard>[] = [
    {
      key: 'member',
      header: t('Member'),
      primary: true,
      sortValue: (card) => card.clientName,
      searchValue: (card) => card.clientName,
      cell: (card) => (
        <span className="font-semibold text-bone">{card.clientName}</span>
      ),
    },
    {
      key: 'number',
      header: t('Card number'),
      sortValue: (card) => card.number,
      searchValue: (card) => card.number,
      cell: (card) => <span className="font-mono">{card.number}</span>,
    },
    {
      key: 'status',
      header: t('Status'),
      sortValue: (card) => Number(card.isActive),
      cell: (card) => (
        <Badge tone={card.isActive ? 'success' : 'neutral'}>
          {card.isActive ? t('Active') : t('Blocked')}
        </Badge>
      ),
    },
    {
      key: 'issued',
      header: t('Issued'),
      sortValue: (card) => card.issuedAt,
      cell: (card) => formatDate(card.issuedAt),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (card) =>
        card.isActive ? (
          <Button
            size="sm"
            variant="warning"
            disabled={setCardActive.isPending}
            onClick={() =>
              confirm({
                title: t('Block card {{number}}?', { number: card.number }),
                description: t(
                  'The card stops working at once, for example when it is lost. You can issue a new one.'
                ),
                confirmLabel: t('Block card'),
                tone: 'warning',
                onConfirm: () =>
                  setCardActive.mutate({ cardId: card.id, isActive: false }),
              })
            }
          >
            {t('Block')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="success"
            disabled={setCardActive.isPending}
            onClick={() =>
              setCardActive.mutate({ cardId: card.id, isActive: true })
            }
          >
            {t('Unblock')}
          </Button>
        ),
    },
  ];

  const table = useTableController({ rows: cards, columns });

  return (
    <>
      <p className="mb-4 text-sm text-bone/60">
        {t('Cards members tap at the door to check in and out.')}
      </p>

      {!settings.cardsEnabled ? (
        <Alert tone="warning" className="mb-4">
          {t('Member cards are turned off.')}{' '}
          <Link to="/settings" className="underline">
            {t('Open settings')}
          </Link>
        </Alert>
      ) : null}
      {setCardActive.error ? (
        <Alert className="mb-4">{setCardActive.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(card) => card.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search cards')}
        action={
          <Button
            icon="plus"
            disabled={!settings.cardsEnabled}
            onClick={openDrawer}
          >
            {t('Issue card')}
          </Button>
        }
        emptyTitle={t('No cards issued yet')}
        emptyHint={t('Issue a card to a member so they can tap in.')}
      />

      <MemberCardFormDrawer
        isOpen={isDrawerOpen}
        clients={clients}
        cards={cards}
        isPending={issueCard.isPending}
        serverError={issueCard.error ? issueCard.error.message : null}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      {dialog}
    </>
  );
};
