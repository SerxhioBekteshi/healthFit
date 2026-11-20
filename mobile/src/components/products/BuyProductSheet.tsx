import React from 'react';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMoney } from '@/hooks/money';
import { usePurchaseProduct } from '@/hooks/products';
import { useTranslation } from '@/i18n';
import type { Product } from '@gym/shared/types';

interface BuyProductSheetProps {
  // The product being confirmed; the sheet is closed while it is null.
  product: Product | null;
  onClose: () => void;
}

// Asks before the price is taken from the member's balance.
export const BuyProductSheet: React.FC<BuyProductSheetProps> = ({
  product,
  onClose,
}) => {
  const { t } = useTranslation();
  const formatMoney = useMoney();
  const purchase = usePurchaseProduct();

  const close = (): void => {
    purchase.reset();
    onClose();
  };

  return (
    <BottomSheet
      visible={product !== null}
      title={t('Buy {{name}}?', { name: product?.name ?? '' })}
      description={
        product
          ? `${formatMoney(product.price)}. ${t('Deducted from your balance now.')}`
          : undefined
      }
      onClose={close}
      submitLabel={t('Buy')}
      onSubmit={() => {
        if (product) purchase.mutate(product.id, { onSuccess: close });
      }}
      isSubmitting={purchase.isPending}
    >
      {purchase.error ? (
        <Banner tone="danger" message={purchase.error.message} />
      ) : null}
    </BottomSheet>
  );
};
