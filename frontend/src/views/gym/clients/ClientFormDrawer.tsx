import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues } from 'react-hook-form';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import type { Client } from '@gym/shared/types';
import { genders, genderLabels } from '@/utils/constants/labels';
import {
  createClientSchema,
  type CreateClientValues,
} from '@gym/shared/validation/clients';

interface ClientFormDrawerProps {
  isOpen: boolean;
  client: Client | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: CreateClientValues) => Promise<void>;
  onClose: () => void;
}

// Gender has no default: the admin must choose it, which also decides the plans the member sees.
const emptyValues: DefaultValues<CreateClientValues> = {
  fullName: '',
  email: '',
  phone: '',
  gender: undefined,
};

export const ClientFormDrawer: React.FC<ClientFormDrawerProps> = ({
  isOpen,
  client,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const isEditing = client !== null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        client
          ? {
              fullName: client.fullName,
              email: client.email,
              phone: client.phone,
              gender: client.gender ?? undefined,
            }
          : emptyValues
      );
    }
  }, [client, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={isEditing ? t('Edit Client') : t('Create Client')}
      description={
        isEditing
          ? t('Fill in client details and save your changes.')
          : t(
              'Fill in the client details. The client chooses their own password with the invite link you get next.'
            )
      }
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={isEditing ? t('Update client') : t('Create client')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="fullName"
          label={t('Full Name')}
          error={errors.fullName?.message}
        >
          <input
            id="fullName"
            className={fieldInputClass}
            {...register('fullName')}
          />
        </FormField>

        <FormField id="email" label={t('Email')} error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="off"
            className={fieldInputClass}
            {...register('email')}
          />
        </FormField>

        <FormField id="phone" label={t('Phone')} error={errors.phone?.message}>
          <input
            id="phone"
            className={fieldInputClass}
            {...register('phone')}
          />
        </FormField>

        <FormField
          id="gender"
          label={t('Gender')}
          error={errors.gender?.message}
        >
          <select
            id="gender"
            className={fieldInputClass}
            {...register('gender')}
          >
            <option value="">{t('Select...')}</option>
            {genders.map((value) => (
              <option key={value} value={value}>
                {genderLabels[value]}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Drawer>
  );
};
