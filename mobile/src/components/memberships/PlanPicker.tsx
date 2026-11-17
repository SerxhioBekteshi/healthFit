import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChipRow } from '@/components/ui/ChipRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { planTerms, weeklyVisitsLabel } from '@/utils/labels';
import { describePlan } from '@/utils/memberships';
import { buildPriceList, savingPercent } from '@/utils/plans';
import type { MembershipPlan } from '@gym/shared/types';
import { PlanOption } from './PlanOption';

interface PlanPickerProps {
  plans: MembershipPlan[];
  // A pending membership blocks buying another one.
  disabled?: boolean;
  onSelect: (plan: MembershipPlan) => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({ stack: { gap: theme.spacing.md } });

// The gym's price list for the member: pick how often you train, then how long you want to commit.
export const PlanPicker: React.FC<PlanPickerProps> = ({
  plans,
  disabled = false,
  onSelect,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const priceList = buildPriceList(plans);
  const [chosen, setChosen] = useState<number | null>(null);

  const frequency =
    chosen !== null && priceList.frequencies.includes(chosen)
      ? chosen
      : priceList.frequencies[0];
  const monthly =
    frequency === undefined ? undefined : priceList.find(frequency, 'monthly');

  return (
    <View style={styles.stack}>
      {frequency !== undefined ? (
        <>
          <SectionHeader title={t('How often do you train?')} />
          <ChipRow
            options={priceList.frequencies.map((value) => ({
              value,
              label: weeklyVisitsLabel(value),
            }))}
            value={frequency}
            onChange={setChosen}
          />
          {planTerms.map((term) => {
            const plan = priceList.find(frequency, term.type);
            return plan ? (
              <PlanOption
                key={plan.id}
                plan={plan}
                title={term.label}
                savingPercent={savingPercent(plan, monthly)}
                disabled={disabled}
                onPress={onSelect}
              />
            ) : null;
          })}
        </>
      ) : null}

      {priceList.extras.length > 0 ? (
        <>
          <SectionHeader title={t('Extras')} />
          <Text variant="caption" tone="muted">
            {t('Daily passes, visit packs and personal training.')}
          </Text>
          {priceList.extras.map((plan) => (
            <PlanOption
              key={plan.id}
              plan={plan}
              title={plan.name || describePlan(plan)}
              disabled={disabled}
              onPress={onSelect}
            />
          ))}
        </>
      ) : null}
    </View>
  );
};
