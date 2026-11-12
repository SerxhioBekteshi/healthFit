import React, { useState } from 'react';
import { ExtraPlans } from '@/components/membership-plans/ExtraPlans';
import { isTermPlan } from '@/components/membership-plans/priceTable';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMembershipPlans } from '@/hooks/membership-plans';
import { usePriceList } from '@/hooks/price-lists';
import { t } from '@/i18n';
import { genderLabels, genders } from '@/utils/constants/labels';
import type { Gender, MembershipPlan } from '@gym/shared/types';
import type { MembershipPlanFormValues } from '@gym/shared/validation/membership-plans';
import { ExtraPlanFormDrawer } from './ExtraPlanFormDrawer';
import { PriceListNotesEditor } from './PriceListNotesEditor';
import { PriceListPhotosManager } from './PriceListPhotosManager';
import { PriceMatrixEditor } from './PriceMatrixEditor';

const Section: React.FC<{
  title: string;
  hint: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, hint, action, children }) => (
  <section className="mb-10">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-bone">{title}</h2>
        <p className="mt-0.5 text-sm text-bone/50">{hint}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const MembershipConfigurationPage: React.FC = () => {
  const {
    plans,
    isLoading,
    error,
    createPlan,
    updatePlan,
    savePriceGrid,
    setPlanActive,
  } = useMembershipPlans();
  const { notes, saveNotes } = usePriceList();
  const [gender, setGender] = useState<Gender>('male');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);

  const genderPlans = plans.filter((plan) => plan.gender === gender);
  const saveMutation = editing ? updatePlan : createPlan;

  const openDrawer = (plan: MembershipPlan | null): void => {
    createPlan.reset();
    updatePlan.reset();
    setEditing(plan);
    setIsDrawerOpen(true);
  };

  const onSubmitExtra = async (
    values: MembershipPlanFormValues
  ): Promise<void> => {
    try {
      if (editing) {
        await updatePlan.mutateAsync({ planId: editing.id, input: values });
      } else {
        await createPlan.mutateAsync(values);
      }
      setGender(values.gender);
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={t('Membership')}
        title={t('Membership')}
        accent={t('configuration')}
        description={t(
          'Set the standard price list your members see: a price for every weekly frequency and term, per gender.'
        )}
      />

      <div className="mb-6">
        <Segmented
          label={t('Prices for')}
          value={gender}
          onChange={setGender}
          options={genders.map((value) => ({
            value,
            label: genderLabels[value],
          }))}
        />
      </div>

      {error ? <Alert className="mb-4">{error.message}</Alert> : null}
      {setPlanActive.error ? (
        <Alert className="mb-4">{setPlanActive.error.message}</Alert>
      ) : null}

      <Section
        title={t('Standard subscriptions - {{gender}}', {
          gender: genderLabels[gender],
        })}
        hint={t(
          'Fill the cells you sell. Longer terms show how much members save against the monthly price.'
        )}
      >
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <PriceMatrixEditor
            key={gender}
            plans={genderPlans}
            isSaving={savePriceGrid.isPending}
            error={savePriceGrid.error?.message ?? null}
            onSave={async (cells) => {
              await savePriceGrid.mutateAsync({ gender, cells });
            }}
          />
        )}
      </Section>

      <Section
        title={t('Passes and extras')}
        hint={t(
          'Daily pass, visit packs and personal training for {{gender}}.',
          { gender: genderLabels[gender].toLowerCase() }
        )}
        action={
          <Button
            variant="secondary"
            icon="plus"
            onClick={() => openDrawer(null)}
          >
            {t('Add extra')}
          </Button>
        }
      >
        {genderPlans.some((plan) => !isTermPlan(plan)) ? (
          <ExtraPlans
            title=""
            plans={genderPlans}
            renderAction={(plan) => (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  icon="pencil"
                  aria-label={t('Edit {{name}}', { name: plan.name })}
                  onClick={() => openDrawer(plan)}
                />
                <Button
                  size="sm"
                  variant={plan.isActive ? 'warning' : 'success'}
                  disabled={setPlanActive.isPending}
                  onClick={() =>
                    setPlanActive.mutate({
                      planId: plan.id,
                      isActive: !plan.isActive,
                    })
                  }
                >
                  {plan.isActive ? t('Hide') : t('Show')}
                </Button>
              </div>
            )}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-bone/50">
            {t('No extras yet. Add a daily pass or a visit pack.')}
          </div>
        )}
      </Section>

      <Section
        title={t('Notes')}
        hint={t(
          'Lines shown under the price list for every member, for example opening hours or classes included.'
        )}
      >
        <PriceListNotesEditor
          notes={notes}
          isSaving={saveNotes.isPending}
          error={saveNotes.error?.message ?? null}
          onSave={async (next) => {
            await saveNotes.mutateAsync({ notes: next });
          }}
        />
      </Section>

      <Section
        title={t('Photos')}
        hint={t(
          'Show your gym on the price list: equipment, classes, the front desk.'
        )}
      >
        <PriceListPhotosManager />
      </Section>

      <ExtraPlanFormDrawer
        isOpen={isDrawerOpen}
        plan={editing}
        defaultGender={gender}
        isPending={saveMutation.isPending}
        serverError={saveMutation.error ? saveMutation.error.message : null}
        onSubmit={onSubmitExtra}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
