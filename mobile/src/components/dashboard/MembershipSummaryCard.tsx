import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VisitBoxes } from '@/components/memberships/VisitBoxes';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useMoney } from '@/hooks/money';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { formatDay } from '@/utils/format';
import { daysRemainingLabel } from '@/utils/memberships';
import type { ClientDashboard } from '@gym/shared/types';

interface MembershipSummaryCardProps {
  membership: ClientDashboard['activeMembership'];
  onChoosePlan: () => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.md },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });

// The running membership: what it is, when it ends and how many visits are left.
export const MembershipSummaryCard: React.FC<MembershipSummaryCardProps> = ({
  membership,
  onChoosePlan,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const formatMoney = useMoney();

  if (!membership) {
    return (
      <Card style={styles.stack}>
        <Text variant="label" tone="muted">
          {t('CURRENT MEMBERSHIP')}
        </Text>
        <Text variant="body" tone="muted">
          {t('No active membership. Pick a plan to get started.')}
        </Text>
        <View>
          <Button
            label={t('Choose a membership')}
            size="sm"
            onPress={onChoosePlan}
          />
        </View>
      </Card>
    );
  }

  const left = Math.max(membership.visitsAllowed - membership.visitsUsed, 0);

  return (
    <Card style={styles.stack}>
      <Text variant="label" tone="muted">
        {t('CURRENT MEMBERSHIP')}
      </Text>
      <Text variant="title">{membership.planName}</Text>
      <View style={styles.row}>
        <Badge label={t('Active')} tone="success" />
        <Text variant="caption" tone="muted">
          {daysRemainingLabel(membership.visitsEndDate)} ·{' '}
          {formatDay(membership.visitsEndDate)}
        </Text>
      </View>
      {membership.visitsAllowed > 0 ? (
        <View style={styles.stack}>
          <Text variant="bodyStrong">
            {t('{{n}} of {{total}} visits left this month', {
              n: left,
              total: membership.visitsAllowed,
            })}
          </Text>
          <VisitBoxes
            total={membership.visitsAllowed}
            used={membership.visitsUsed}
          />
        </View>
      ) : membership.planType === 'visit_based' ? (
        <Text variant="bodyStrong">
          {t('{{n}} visits remaining', { n: membership.visitsRemaining })}
        </Text>
      ) : (
        <Text variant="bodyStrong">{t('Unlimited visits')}</Text>
      )}
      <Text variant="caption" tone="subtle">
        {t('Paid {{amount}}', { amount: formatMoney(membership.price) })}
      </Text>
    </Card>
  );
};
