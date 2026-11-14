import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { Drawer } from '@/components/ui/Drawer';
import { t } from '@/i18n';
import type { Client, MemberCard } from '@gym/shared/types';
import {
  issueCardSchema,
  type IssueCardValues,
} from '@gym/shared/validation/member-cards';

interface MemberCardFormDrawerProps {
  isOpen: boolean;
  clients: Client[];
  cards: MemberCard[];
  // Member picked when the drawer opens, e.g. from a row action.
  clientId?: string;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: IssueCardValues) => Promise<void>;
  onClose: () => void;
}

export const MemberCardFormDrawer: React.FC<MemberCardFormDrawerProps> = ({
  isOpen,
  clients,
  cards,
  clientId,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<IssueCardValues>({ resolver: zodResolver(issueCardSchema) });

  useEffect(() => {
    if (isOpen) reset({ clientId: clientId ?? '', number: '' });
  }, [isOpen, clientId, reset]);

  const activeClients = clients
    .filter((client) => client.isActive)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const current = cards.find(
    (card) => card.isActive && card.clientId === watch('clientId')
  );

  return (
    <Drawer
      isOpen={isOpen}
      title={t('Issue Card')}
      description={t(
        'Tap the card on the reader or type its number. The member can check in and out with it.'
      )}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={t('Issue card')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="cardClient"
          label={t('Member')}
          error={errors.clientId?.message}
        >
          <select
            id="cardClient"
            className={fieldInputClass}
            {...register('clientId')}
          >
            <option value="">{t('Select a member...')}</option>
            {activeClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="cardNumber"
          label={t('Card number')}
          error={errors.number?.message}
          hint={
            current
              ? t('This replaces the member card {{number}}.', {
                  number: current.number,
                })
              : undefined
          }
        >
          <input
            id="cardNumber"
            autoFocus
            autoComplete="off"
            className={`${fieldInputClass} font-mono uppercase`}
            {...register('number')}
          />
        </FormField>
      </form>
    </Drawer>
  );
};
