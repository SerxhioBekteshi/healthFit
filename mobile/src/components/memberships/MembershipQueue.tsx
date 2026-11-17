import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { membershipStatusLabels, membershipStatusTone } from '@/utils/labels';
import { describePeriod, queueOf } from '@/utils/memberships';
import type { Membership } from '@gym/shared/types';

interface MembershipQueueProps {
  memberships: Membership[];
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: theme.spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    info: { flex: 1, gap: 2 },
  });

// The memberships in order: the one running, the ones queued after it, and any waiting for payment.
export const MembershipQueue: React.FC<MembershipQueueProps> = ({
  memberships,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const queue = queueOf(memberships);
  if (queue.length === 0) return null;

  return (
    <View style={styles.stack}>
      <SectionHeader title={t('My memberships')} />
      {queue.map((membership) => (
        <Card key={membership.id}>
          <View style={styles.row}>
            <View style={styles.info}>
              <Text variant="bodyStrong">{membership.planName}</Text>
              <Text variant="caption" tone="muted">
                {membership.status === 'pending'
                  ? t('Waiting for payment to be confirmed')
                  : describePeriod(membership)}
              </Text>
            </View>
            <Badge
              label={membershipStatusLabels[membership.status]}
              tone={membershipStatusTone[membership.status]}
            />
          </View>
        </Card>
      ))}
    </View>
  );
};
