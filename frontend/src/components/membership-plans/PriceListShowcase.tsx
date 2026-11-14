import React from 'react';
import { ExtraPlans } from '@/components/membership-plans/ExtraPlans';
import { groupOffers } from '@/components/membership-plans/offerGroups';
import { OfferPlans } from '@/components/membership-plans/OfferPlans';
import { PhotoGallery } from '@/components/membership-plans/PhotoGallery';
import { PriceMatrix } from '@/components/membership-plans/PriceMatrix';
import { Icon } from '@/components/ui/Icon';
import { t } from '@/i18n';
import type { MembershipPlan, PriceListPhoto } from '@gym/shared/types';

interface PriceListShowcaseProps {
  plans: MembershipPlan[];
  notes: string[];
  photos: PriceListPhoto[];
  // Omit for a read-only price list; with it every price becomes a subscribe button.
  onSelectPlan?: (plan: MembershipPlan) => void;
  disabled?: boolean;
  renderExtraAction?: (plan: MembershipPlan) => React.ReactNode;
}

// What a member sees: the standard price table (or the special offer that replaces it), the gym's notes, offers on chosen plans, extras and photos.
export const PriceListShowcase: React.FC<PriceListShowcaseProps> = ({
  plans,
  notes,
  photos,
  onSelectPlan,
  disabled,
  renderExtraAction,
}) => {
  const { priceList, custom } = groupOffers(plans);
  const action = renderExtraAction ?? (() => null);
  // Extras already shown in an offer card are not repeated under extras.
  const inOfferCards = new Set(
    custom.flatMap((group) => group.plans.map((plan) => plan.id))
  );

  return (
    <div className="space-y-8">
      <PriceMatrix
        plans={plans}
        offer={priceList?.offer}
        onSelect={onSelectPlan}
        disabled={disabled}
      />

      {custom.map((group) => (
        <OfferPlans key={group.offer.id} group={group} renderAction={action} />
      ))}

      {notes.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <li
              key={note}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-panel px-4 py-3 text-sm text-bone/80"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-signal/15 text-signal">
                <Icon name="check" className="h-3 w-3" />
              </span>
              {note}
            </li>
          ))}
        </ul>
      ) : null}

      <ExtraPlans
        plans={plans.filter(
          (plan) => plan.isActive && !inOfferCards.has(plan.id)
        )}
        title={t('Passes and extras')}
        renderAction={action}
      />

      <PhotoGallery photos={photos} />
    </div>
  );
};
