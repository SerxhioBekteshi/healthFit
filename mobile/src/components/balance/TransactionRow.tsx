import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useMoney } from '@/hooks/money';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { formatDateTime } from '@/utils/format';
import { paymentMethodLabels, transactionTypeLabels } from '@/utils/labels';
import type { BalanceTransaction } from '@gym/shared/types';

interface TransactionRowProps {
  transaction: BalanceTransaction;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    info: { flex: 1, gap: 2 },
  });

// One line of the balance history: money in is green, money out is plain.
export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
}) => {
  const styles = useThemedStyles(createStyles);
  useTranslation();
  const formatMoney = useMoney();
  const incoming = transaction.amount > 0;

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="bodyStrong">
            {transaction.description || transactionTypeLabels[transaction.type]}
          </Text>
          <Text variant="caption" tone="muted">
            {formatDateTime(transaction.createdAt)} ·{' '}
            {paymentMethodLabels[transaction.paymentMethod]}
          </Text>
        </View>
        <Text variant="bodyStrong" tone={incoming ? 'success' : 'default'}>
          {incoming ? '+' : ''}
          {formatMoney(transaction.amount)}
        </Text>
      </View>
    </Card>
  );
};
