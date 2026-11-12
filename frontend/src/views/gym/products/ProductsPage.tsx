import React, { useState } from 'react';
import { ProductImage } from '@/components/products/ProductImage';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type Column } from '@/components/ui/Table';
import { useProducts } from '@/hooks/products';
import { useTableController } from '@/hooks/table';
import { t } from '@/i18n';
import { formatMoney } from '@/utils/format';
import { productCategoryLabels } from '@/utils/constants/product-categories';
import type { Product } from '@gym/shared/types';
import {
  isPreparedCategory,
  type ProductFormValues,
} from '@gym/shared/validation/products';
import { ProductFormDrawer } from './ProductFormDrawer';

export const ProductsPage: React.FC = () => {
  const {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    setProductActive,
  } = useProducts();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const saveMutation = editing ? updateProduct : createProduct;
  const serverError = saveMutation.error ? saveMutation.error.message : null;

  const openDrawer = (product: Product | null): void => {
    createProduct.reset();
    updateProduct.reset();
    setEditing(product);
    setIsDrawerOpen(true);
  };

  const onSubmit = async (values: ProductFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateProduct.mutateAsync({
          productId: editing.id,
          input: values,
        });
      } else {
        await createProduct.mutateAsync(values);
      }
      setIsDrawerOpen(false);
    } catch {
      // The error is shown in the drawer through serverError.
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: t('Product'),
      primary: true,
      sortValue: (product) => product.name,
      searchValue: (product) =>
        `${product.name} ${productCategoryLabels[product.category]}`,
      cell: (product) => (
        <div className="flex items-center gap-3">
          <ProductImage
            category={product.category}
            imageUrl={product.imageUrl}
            name={product.name}
            className="h-10 w-10"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-bone">{product.name}</p>
            <p className="truncate text-xs text-bone/45">
              {productCategoryLabels[product.category]}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: t('Price'),
      sortValue: (product) => product.price,
      searchValue: (product) => product.price,
      cell: (product) => (
        <span className="font-semibold tabular-nums text-bone">
          {formatMoney(product.price)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: t('Stock'),
      sortValue: (product) => product.stock,
      searchValue: (product) =>
        isPreparedCategory(product.category)
          ? t('Made to order cash only')
          : product.stock,
      cell: (product) =>
        isPreparedCategory(product.category) ? (
          <Badge tone="warning" dot={false}>
            {t('Made to order · cash only')}
          </Badge>
        ) : (
          <span className="tabular-nums">{product.stock}</span>
        ),
    },
    {
      key: 'status',
      header: t('Status'),
      searchValue: (product) =>
        product.isActive ? t('Active') : t('Inactive'),
      cell: (product) => (
        <Badge tone={product.isActive ? 'success' : 'neutral'}>
          {product.isActive ? t('Active') : t('Inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      actions: true,
      align: 'right',
      cell: (product) => (
        <>
          <Button
            size="sm"
            variant="secondary"
            icon="pencil"
            onClick={() => openDrawer(product)}
          >
            {t('Edit')}
          </Button>
          <Button
            size="sm"
            variant={product.isActive ? 'warning' : 'success'}
            disabled={setProductActive.isPending}
            onClick={() =>
              setProductActive.mutate({
                productId: product.id,
                isActive: !product.isActive,
              })
            }
          >
            {product.isActive ? t('Disable') : t('Enable')}
          </Button>
        </>
      ),
    },
  ];

  const table = useTableController({ rows: products, columns });

  return (
    <>
      <PageHeader
        title={t('Counter')}
        accent={t('products')}
        actions={
          <Button icon="plus" onClick={() => openDrawer(null)}>
            {t('Create product')}
          </Button>
        }
      />

      {setProductActive.error ? (
        <Alert className="mb-4">{setProductActive.error.message}</Alert>
      ) : null}

      <Table
        controller={table}
        rowKey={(product) => product.id}
        isLoading={isLoading}
        error={error?.message ?? null}
        searchPlaceholder={t('Search products')}
        emptyTitle={t('No products yet')}
        emptyHint={t('Add something your members can buy.')}
      />

      <ProductFormDrawer
        isOpen={isDrawerOpen}
        product={editing}
        isPending={saveMutation.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
