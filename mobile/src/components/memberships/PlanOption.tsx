import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useMoney } from '@/hooks/money';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { formatDay } from '@/utils/format';
import { describePlan, planPrice } from '@/utils/memberships';
import type { MembershipPlan } from '@gym/shared/types';

interface PlanOptionProps {
  plan: MembershipPlan;
  // Heading of the option; defaults to the full description of the plan.
  title?: string;
  // "Save 15%" against paying monthly.
  savingPercent?: number;
  disabled?: boolean;
  onPress: (plan: MembershipPlan) => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    info: { flex: 1, gap: theme.spacing.xs },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    prices: { alignItems: 'flex-end' },
    strike: { textDecorationLine: 'line-through' },
    disabled: { opacity: 0.5 },
  });

// One plan the member can buy, with its price, saving and any special offer.
export const PlanOption: React.FC<PlanOptionProps> = ({
  plan,
  title,
  savingPercent = 0,
  disabled = false,
  onPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const formatMoney = useMoney();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onPress(plan)}
      style={[styles.option, disabled ? styles.disabled : null]}
    >
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong">{title ?? describePlan(plan)}</Text>
          {savingPercent > 0 ? (
            <Badge
              label={t('Save {{n}}%', { n: savingPercent })}
              tone="success"
            />
          ) : null}
        </View>
        {plan.offer ? (
          <Text variant="caption" tone="accent">
            {t('{{name}} until {{date}}', {
              name: plan.offer.name,
              date: formatDay(plan.offer.endDate),
            })}
          </Text>
        ) : null}
      </View>
      <View style={styles.prices}>
        <Text variant="heading">{formatMoney(planPrice(plan))}</Text>
        {plan.offer ? (
          <Text variant="caption" tone="subtle" style={styles.strike}>
            {formatMoney(plan.price)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};
