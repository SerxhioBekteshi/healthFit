import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BuyProductSheet } from '@/components/products/BuyProductSheet';
import { ProductCard } from '@/components/products/ProductCard';
import { Banner } from '@/components/ui/Banner';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useClientDashboard } from '@/hooks/dashboard';
import { useMoney } from '@/hooks/money';
import { usePaymentSettings } from '@/hooks/payment-settings';
import { useProducts } from '@/hooks/products';
import { useRefresh } from '@/hooks/refresh';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import type { Product } from '@gym/shared/types';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    balance: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    list: { gap: theme.spacing.lg },
  });

export default function ProductsScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const formatMoney = useMoney();
  const settings = usePaymentSettings();
  const products = useProducts();
  const dashboard = useClientDashboard();
  const { refreshing, onRefresh } = useRefresh(
    products.refetch,
    dashboard.refetch
  );
  const [chosen, setChosen] = useState<Product | null>(null);
  const balance = dashboard.data?.balance;

  return (
    <Screen
      edges={['bottom']}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      <Card style={styles.balance}>
        <Text variant="label" tone="muted">
          {t('Balance')}
        </Text>
        <Text variant="title" tone="accent">
          {balance === undefined ? '-' : formatMoney(balance)}
        </Text>
      </Card>
      {settings.acceptBalance ? null : (
        <Banner
          tone="warning"
          message={t(
            'Your gym does not take payments from the balance. Pay at the counter.'
          )}
        />
      )}
      <QueryBoundary query={products}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState
              icon="cart-outline"
              title={t('No products available at your gym right now.')}
            />
          ) : (
            <View style={styles.list}>
              {list.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  affordable={balance !== undefined && balance >= product.price}
                  canBuy={settings.acceptBalance}
                  onBuy={setChosen}
                />
              ))}
            </View>
          )
        }
      </QueryBoundary>
      <BuyProductSheet product={chosen} onClose={() => setChosen(null)} />
    </Screen>
  );
}
