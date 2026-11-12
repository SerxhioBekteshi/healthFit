import React, { useState } from 'react';
import { ProductImage } from '@/components/products/ProductImage';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBalance } from '@/hooks/balance';
import { useProducts } from '@/hooks/products';
import {
  PREPARED_WARNING,
  productCategoryLabels,
} from '@/utils/constants/product-categories';
import { t } from '@/i18n';
import { formatMoney } from '@/utils/format';
import { isPreparedCategory } from '@gym/shared/validation/products';

type Feedback = { type: 'success' | 'error'; message: string } | null;

export const ClientProductsPage: React.FC = () => {
  const { balance } = useBalance();
  const { products, isLoading, error, purchaseProduct } = useProducts();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const onPurchase = async (productId: string): Promise<void> => {
    try {
      await purchaseProduct.mutateAsync({
        productId,
        input: { paymentMethod: 'balance' },
      });
      setFeedback({ type: 'success', message: t('Purchase completed.') });
    } catch (submitError) {
      setFeedback({
        type: 'error',
        message:
          submitError instanceof Error
            ? submitError.message
            : t('Purchase failed.'),
      });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={t('Member area')}
        title={t('Gym')}
        accent={t('shop')}
        description={t('Purchase from the gym using your balance.')}
        actions={
          <div className="rounded-lg border border-white/10 bg-panel px-4 py-2 text-sm">
            <span className="text-bone/50">{t('Balance')} </span>
            <span className="font-bold tabular-nums text-signal">
              {formatMoney(balance)}
            </span>
          </div>
        }
      />

      {feedback ? (
        <Alert
          className="mb-5"
          tone={feedback.type === 'success' ? 'success' : 'error'}
        >
          {feedback.message}
        </Alert>
      ) : null}
      {error ? <Alert>{error.message}</Alert> : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-40" />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-bone/55">
          {t('No products available at your gym right now.')}
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const prepared = isPreparedCategory(product.category);
            const affordable = balance >= product.price;
            return (
              <article
                key={product.id}
                className="client-card-reveal flex flex-col justify-between rounded-xl border border-white/10 bg-panel p-5 shadow-sm transition-colors duration-200 hover:border-white/25"
              >
                <div className="flex items-start gap-3">
                  <ProductImage
                    category={product.category}
                    imageUrl={product.imageUrl}
                    name={product.name}
                    className="h-16 w-16"
                  />
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-bone">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-bone/45">
                      {prepared ? (
                        productCategoryLabels[product.category]
                      ) : (
                        <>{t('{{stock}} in stock', { stock: product.stock })}</>
                      )}
                    </p>
                  </div>
                </div>
                {prepared ? (
                  <Alert tone="warning" className="mt-4 !px-3 !py-2 text-xs">
                    {t(PREPARED_WARNING)}
                  </Alert>
                ) : null}
                <div className="mt-6 flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums text-signal">
                    {formatMoney(product.price)}
                  </p>
                  {prepared ? null : (
                    <Button
                      size="sm"
                      variant={affordable ? 'primary' : 'secondary'}
                      disabled={purchaseProduct.isPending || !affordable}
                      onClick={() => onPurchase(product.id)}
                    >
                      {affordable ? t('Buy') : t('Low balance')}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </>
  );
};
