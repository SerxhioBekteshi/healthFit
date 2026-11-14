import React, { useState } from 'react';
import { planLabel } from '@/components/membership-plans/planLabel';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/hooks/confirm';
import { usePriceOffers } from '@/hooks/price-offers';
import { t } from '@/i18n';
import {
  priceOfferStatusLabels,
  priceOfferStatusTone,
} from '@/utils/constants/labels';
import { formatDay, formatMoney } from '@/utils/format';
import { Section } from '@/views/gym/membership-plans/Section';
import type { MembershipPlan, PriceOffer } from '@gym/shared/types';
import type { PriceOfferFormValues } from '@gym/shared/validation/price-offers';
import { PriceOfferFormDrawer } from './PriceOfferFormDrawer';

interface PriceOffersSectionProps {
  plans: MembershipPlan[];
}

// Limited-time prices on top of the standard price list: one plan or a whole seasonal list.
export const PriceOffersSection: React.FC<PriceOffersSectionProps> = ({
  plans,
}) => {
  const {
    offers,
    isLoading,
    error,
    createOffer,
    updateOffer,
    setOfferActive,
    deleteOffer,
  } = usePriceOffers();
  const { confirm, dialog } = useConfirm();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PriceOffer | null>(null);

  const saveMutation = editing ? updateOffer : createOffer;
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  const openDrawer = (offer: PriceOffer | null): void => {
    createOffer.reset();
    updateOffer.reset();
    setEditing(offer);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: PriceOfferFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateOffer.mutateAsync({ offerId: editing.id, input: values });
      } else {
        await createOffer.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  return (
    <Section
      title={t('Special offers')}
      hint={t(
        'A lower price for some plans during a period, for example New Year or a summer price list. Members see the offer next to the regular price.'
      )}
      action={
        <Button
          variant="secondary"
          icon="plus"
          disabled={plans.every((plan) => !plan.isActive)}
          onClick={() => openDrawer(null)}
        >
          {t('New offer')}
        </Button>
      }
    >
      {error ? <Alert className="mb-4">{error.message}</Alert> : null}
      {setOfferActive.error ? (
        <Alert className="mb-4">{setOfferActive.error.message}</Alert>
      ) : null}
      {deleteOffer.error ? (
        <Alert className="mb-4">{deleteOffer.error.message}</Alert>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-bone/50">
          {t('No offers yet. Create one for a holiday or a season.')}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {offers.map((offer) => (
            <article
              key={offer.id}
              className={`rounded-xl border border-white/10 bg-panel p-5 ${
                offer.status === 'ended' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-bone">
                    {offer.name}
                    <Badge tone={priceOfferStatusTone[offer.status]}>
                      {priceOfferStatusLabels[offer.status]}
                    </Badge>
                  </p>
                  <p className="mt-1 text-xs text-bone/50">
                    {t('{{from}} to {{to}}', {
                      from: formatDay(offer.startDate),
                      to: formatDay(offer.endDate),
                    })}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="pencil"
                    aria-label={t('Edit {{name}}', { name: offer.name })}
                    onClick={() => openDrawer(offer)}
                  />
                  {offer.status === 'ended' ? null : (
                    <Button
                      size="sm"
                      variant={offer.isActive ? 'warning' : 'success'}
                      disabled={setOfferActive.isPending}
                      onClick={() =>
                        setOfferActive.mutate({
                          offerId: offer.id,
                          isActive: !offer.isActive,
                        })
                      }
                    >
                      {offer.isActive ? t('Pause') : t('Resume')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    icon="trash"
                    aria-label={t('Delete {{name}}', { name: offer.name })}
                    disabled={deleteOffer.isPending}
                    onClick={() =>
                      confirm({
                        title: t('Delete {{name}}?', { name: offer.name }),
                        description: t(
                          'Members who already bought at the offer price keep it. New purchases pay the regular price.'
                        ),
                        confirmLabel: t('Delete offer'),
                        tone: 'danger',
                        onConfirm: () => deleteOffer.mutate(offer.id),
                      })
                    }
                  />
                </div>
              </div>

              <ul className="mt-4 divide-y divide-white/10 text-sm">
                {offer.items.map((item) => {
                  const plan = planById.get(item.planId);
                  return (
                    <li
                      key={item.planId}
                      className="flex items-center justify-between gap-3 py-1.5"
                    >
                      <span className="min-w-0 truncate text-bone/80">
                        {plan ? planLabel(plan) : item.planName}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        <span className="mr-2 text-bone/40 line-through">
                          {formatMoney(item.regularPrice)}
                        </span>
                        <span className="font-semibold text-signal">
                          {formatMoney(item.price)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}

      <PriceOfferFormDrawer
        isOpen={isDrawerOpen}
        offer={editing}
        plans={plans}
        isPending={saveMutation.isPending}
        serverError={saveMutation.error ? saveMutation.error.message : null}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
      {dialog}
    </Section>
  );
};
