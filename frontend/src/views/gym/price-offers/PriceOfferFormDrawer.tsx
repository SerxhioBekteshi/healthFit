import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { planLabel } from '@/components/membership-plans/planLabel';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { getCurrency, t } from '@/i18n';
import { formatMoney } from '@/utils/format';
import type { MembershipPlan, PriceOffer } from '@gym/shared/types';
import {
  priceOfferFormSchema,
  type PriceOfferFormValues,
} from '@gym/shared/validation/price-offers';

interface PriceOfferFormDrawerProps {
  isOpen: boolean;
  offer: PriceOffer | null;
  plans: MembershipPlan[];
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: PriceOfferFormValues) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_DISCOUNT = 10;

const isoDay = (offsetDays: number): string =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

export const PriceOfferFormDrawer: React.FC<PriceOfferFormDrawerProps> = ({
  isOpen,
  offer,
  plans,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PriceOfferFormValues>({
    resolver: zodResolver(priceOfferFormSchema),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const [discount, setDiscount] = useState(DEFAULT_DISCOUNT);

  useEffect(() => {
    if (isOpen) {
      reset(
        offer
          ? {
              name: offer.name,
              startDate: offer.startDate,
              endDate: offer.endDate,
              items: offer.items.map((item) => ({
                planId: item.planId,
                price: item.price,
              })),
            }
          : { name: '', startDate: isoDay(0), endDate: isoDay(30), items: [] }
      );
      setDiscount(DEFAULT_DISCOUNT);
    }
  }, [offer, isOpen, reset]);

  const chosen = watch('items') ?? [];
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const available = plans.filter(
    (plan) => plan.isActive && !chosen.some((item) => item.planId === plan.id)
  );

  const addAll = (): void => {
    for (const plan of available) {
      const price = Math.round(plan.price * (100 - discount)) / 100;
      append({ planId: plan.id, price });
    }
  };

  const itemsError = errors.items?.root?.message ?? errors.items?.message;

  return (
    <Drawer
      isOpen={isOpen}
      title={offer ? t('Edit Offer') : t('New Offer')}
      description={t(
        'A limited-time price for the plans you choose. It replaces the regular price while it is valid.'
      )}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={offer ? t('Update offer') : t('Create offer')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          id="offerName"
          label={t('Offer name')}
          error={errors.name?.message}
        >
          <input
            id="offerName"
            className={fieldInputClass}
            placeholder={t("New Year's Eve")}
            {...register('name')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="offerStart"
            label={t('Valid from')}
            error={errors.startDate?.message}
          >
            <input
              id="offerStart"
              type="date"
              className={fieldInputClass}
              {...register('startDate')}
            />
          </FormField>
          <FormField
            id="offerEnd"
            label={t('Valid until')}
            error={errors.endDate?.message}
            hint={t('This day is included.')}
          >
            <input
              id="offerEnd"
              type="date"
              className={fieldInputClass}
              {...register('endDate')}
            />
          </FormField>
        </div>

        <fieldset className="grid gap-3">
          <legend className="mb-1.5 text-sm font-medium text-bone/70">
            {t('Plans in this offer')}
          </legend>

          {fields.map((field, index) => {
            const plan = planById.get(chosen[index]?.planId ?? field.planId);
            return (
              <div
                key={field.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-bone">
                      {plan ? planLabel(plan) : t('Plan no longer available')}
                    </p>
                    {plan ? (
                      <p className="mt-0.5 text-xs text-bone/50">
                        {t('Regular price {{price}}', {
                          price: formatMoney(plan.price),
                        })}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="trash"
                    aria-label={t('Remove from offer')}
                    onClick={() => remove(index)}
                  />
                </div>
                <input type="hidden" {...register(`items.${index}.planId`)} />
                <div className="mt-2">
                  <FormField
                    id={`offer-price-${index}`}
                    label={t('Offer price ({{currency}})', {
                      currency: getCurrency(),
                    })}
                    error={errors.items?.[index]?.price?.message}
                  >
                    <input
                      id={`offer-price-${index}`}
                      type="number"
                      min={0}
                      step="any"
                      className={fieldInputClass}
                      {...register(`items.${index}.price`, {
                        valueAsNumber: true,
                      })}
                    />
                  </FormField>
                </div>
              </div>
            );
          })}

          {fields.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 px-4 py-6 text-center text-sm text-bone/50">
              {t('Add the plans this offer applies to.')}
            </p>
          ) : null}
          {itemsError ? (
            <p className="text-xs text-danger">{t(itemsError)}</p>
          ) : null}

          {available.length > 0 ? (
            <div className="grid gap-3 rounded-lg border border-white/10 p-3">
              <select
                aria-label={t('Add a plan')}
                className={fieldInputClass}
                value=""
                onChange={(event) => {
                  const plan = planById.get(event.target.value);
                  if (plan) append({ planId: plan.id, price: plan.price });
                }}
              >
                <option value="">{t('+ Add a plan')}</option>
                {available.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {planLabel(plan)} — {formatMoney(plan.price)}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-28">
                  <FormField id="offerDiscount" label={t('Discount (%)')}>
                    <input
                      id="offerDiscount"
                      type="number"
                      min={1}
                      max={99}
                      className={fieldInputClass}
                      value={discount}
                      onChange={(event) =>
                        setDiscount(Number(event.target.value))
                      }
                    />
                  </FormField>
                </div>
                <Button variant="secondary" icon="plus" onClick={addAll}>
                  {t('Add all plans')}
                </Button>
              </div>
              <p className="text-xs text-bone/45">
                {t(
                  'Adds every visible plan with the discount taken off its regular price. Change any price after.'
                )}
              </p>
            </div>
          ) : null}
        </fieldset>
      </form>
    </Drawer>
  );
};
