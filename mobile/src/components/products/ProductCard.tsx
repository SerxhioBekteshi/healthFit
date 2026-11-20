import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProductImage } from '@/components/products/ProductImage';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useMoney } from '@/hooks/money';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { PREPARED_WARNING, productCategoryLabels } from '@/utils/labels';
import type { Product } from '@gym/shared/types';
import { isPreparedCategory } from '@gym/shared/validation/products';

interface ProductCardProps {
  product: Product;
  affordable: boolean;
  // The gym's choice: with it off, products are paid at the counter.
  canBuy: boolean;
  onBuy: (product: Product) => void;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { gap: theme.spacing.md },
    top: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    titles: { flex: 1, gap: 2 },
    bottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
  });

// A product with its price; made-to-order ones (shakes, smoothies) are paid in cash, so they have no Buy button.
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  affordable,
  canBuy,
  onBuy,
}) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const formatMoney = useMoney();
  const prepared = isPreparedCategory(product.category);

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <ProductImage
          category={product.category}
          imageUrl={product.imageUrl}
          name={product.name}
        />
        <View style={styles.titles}>
          <Text variant="heading">{product.name}</Text>
          <Text variant="caption" tone="muted">
            {prepared
              ? productCategoryLabels[product.category]
              : t('{{stock}} in stock', { stock: product.stock })}
          </Text>
        </View>
      </View>
      {prepared ? (
        <Banner tone="warning" message={t(PREPARED_WARNING)} />
      ) : null}
      <View style={styles.bottom}>
        <Text variant="title" tone="accent">
          {formatMoney(product.price)}
        </Text>
        {prepared ? null : (
          <Button
            label={affordable ? t('Buy') : t('Low balance')}
            size="sm"
            variant={affordable ? 'primary' : 'secondary'}
            disabled={!affordable || !canBuy}
            onPress={() => onBuy(product)}
          />
        )}
      </View>
    </Card>
  );
};
