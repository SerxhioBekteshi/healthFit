import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BalanceFilterSheet } from '@/components/balance/BalanceFilterSheet';
import { TopUpSheet } from '@/components/balance/TopUpSheet';
import { TransactionRow } from '@/components/balance/TransactionRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InfiniteList } from '@/components/ui/InfiniteList';
import { Text } from '@/components/ui/Text';
import { useBalanceHistory } from '@/hooks/balance';
import { useMoney } from '@/hooks/money';
import { usePaymentSettings } from '@/hooks/payment-settings';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import type { BalanceHistoryFilters } from '@gym/shared/types';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: { gap: theme.spacing.lg },
    summary: { gap: theme.spacing.md },
    // The title wraps in long languages instead of pushing the Filter button out.
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    historyTitle: { flexShrink: 1 },
  });

// How many filters are set.
const countFilters = (filters: BalanceHistoryFilters): number =>
  Object.values(filters).filter((value) => value !== undefined).length;

export default function BalanceScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const formatMoney = useMoney();
  const settings = usePaymentSettings();
  const [filters, setFilters] = useState<BalanceHistoryFilters>({});
  const history = useBalanceHistory(filters);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Credit is topped up by card; both switches are the gym's choice.
  const canTopUp = settings.acceptBalance && settings.acceptCard;
  const active = countFilters(filters);

  return (
    <>
      <InfiniteList
        data={history.data?.transactions}
        query={history}
        keyExtractor={(transaction) => transaction.id}
        renderItem={(transaction) => (
          <TransactionRow transaction={transaction} />
        )}
        emptyTitle={
          active > 0
            ? t('No transactions match these filters')
            : t('No transactions yet')
        }
        emptyMessage={
          active > 0
            ? undefined
            : t('Top-ups, memberships and purchases show up here.')
        }
        header={
          <View style={styles.header}>
            <Card style={styles.summary}>
              <View>
                <Text variant="label" tone="muted">
                  {t('AVAILABLE CREDIT')}
                </Text>
                <Text variant="display">
                  {formatMoney(history.data?.balance ?? 0)}
                </Text>
              </View>
              {canTopUp ? (
                <Button
                  label={t('Top up')}
                  icon="add-circle-outline"
                  onPress={() => setTopUpOpen(true)}
                />
              ) : null}
            </Card>
            <View style={styles.historyRow}>
              <Text variant="heading" style={styles.historyTitle}>
                {t('Transaction history')}
              </Text>
              <Button
                label={
                  active > 0 ? t('Filter ({{n}})', { n: active }) : t('Filter')
                }
                icon="filter-outline"
                size="sm"
                variant={active > 0 ? 'primary' : 'secondary'}
                onPress={() => setFilterOpen(true)}
              />
            </View>
          </View>
        }
      />
      <TopUpSheet visible={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <BalanceFilterSheet
        visible={filterOpen}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </>
  );
}
