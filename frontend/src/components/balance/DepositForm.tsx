import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { CardFields } from '@/components/payments/CardFields';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { getCurrency, t } from '@/i18n';
import { paymentMethodLabels } from '@/utils/constants/labels';
import type { CardSummary } from '@gym/shared/types';
import {
  depositFormSchema,
  type DepositValues,
} from '@gym/shared/validation/balance';

type DepositMethod = DepositValues['paymentMethod'];
type FormValues = Omit<DepositValues, 'card'>;

interface DepositFormProps {
  methods: DepositMethod[];
  isPending: boolean;
  serverError: string | null;
  successMessage: string | null;
  // Tighter card form for wide layouts.
  compact?: boolean;
  onSubmit: (values: DepositValues) => Promise<void>;
}

const DEFAULT_AMOUNT = 1000;

export const DepositForm: React.FC<DepositFormProps> = ({
  methods,
  isPending,
  serverError,
  successMessage,
  compact = false,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: { amount: DEFAULT_AMOUNT, paymentMethod: methods[0] },
  });
  const [card, setCard] = useState<CardSummary | null>(null);
  const [cardAttempted, setCardAttempted] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const isCard = watch('paymentMethod') === 'card';

  const submit = async (values: FormValues): Promise<void> => {
    if (values.paymentMethod === 'card' && !card) {
      setCardAttempted(true);
      return;
    }
    await onSubmit({
      ...values,
      card: values.paymentMethod === 'card' ? (card ?? undefined) : undefined,
    });
    reset({ amount: DEFAULT_AMOUNT, paymentMethod: values.paymentMethod });
    // A fresh card form after every payment so no card data lingers.
    setCardKey((key) => key + 1);
    setCardAttempted(false);
  };

  const amountField = (
    <FormField
      id="deposit-amount"
      label={t('Amount ({{currency}})', { currency: getCurrency() })}
      error={errors.amount?.message}
    >
      <input
        id="deposit-amount"
        type="number"
        step="any"
        className={fieldInputClass}
        {...register('amount', { valueAsNumber: true })}
      />
    </FormField>
  );
  const submitButton = (
    <Button type="submit" icon="plus" loading={isPending}>
      {isPending ? t('Adding') : t('Add to balance')}
    </Button>
  );
  const cardFields = isCard ? (
    <CardFields
      key={cardKey}
      compact={compact}
      onChange={setCard}
      showErrors={cardAttempted}
    />
  ) : null;
  const feedback = (
    <>
      {serverError ? <Alert>{serverError}</Alert> : null}
      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
    </>
  );

  // One method needs no picker: card details first, then amount and button on one row.
  if (compact && methods.length === 1) {
    return (
      <form onSubmit={handleSubmit(submit)} className="space-y-3">
        <input type="hidden" {...register('paymentMethod')} />
        {cardFields}
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          {amountField}
          {submitButton}
        </div>
        {feedback}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {amountField}
        <FormField
          id="deposit-method"
          label={t('Method')}
          error={errors.paymentMethod?.message}
        >
          {methods.length === 1 ? (
            <>
              <input type="hidden" {...register('paymentMethod')} />
              <p className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-bone">
                {paymentMethodLabels[methods[0]]}
              </p>
            </>
          ) : (
            <select
              id="deposit-method"
              className={fieldInputClass}
              {...register('paymentMethod')}
            >
              {methods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      {cardFields}
      {submitButton}
      {feedback}
    </form>
  );
};
