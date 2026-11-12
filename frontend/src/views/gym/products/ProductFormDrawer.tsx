import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { ProductImage } from '@/components/products/ProductImage';
import { Alert } from '@/components/ui/Alert';
import { Drawer } from '@/components/ui/Drawer';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { ImageField } from '@/components/common/ImageField';
import { t } from '@/i18n';
import {
  PREPARED_WARNING,
  productCategoryLabels,
} from '@/utils/constants/product-categories';
import type { Product } from '@gym/shared/types';
import {
  isPreparedCategory,
  productCategories,
  productFormSchema,
  type ProductFormValues,
} from '@gym/shared/validation/products';

interface ProductFormDrawerProps {
  isOpen: boolean;
  product: Product | null;
  isPending: boolean;
  serverError: string | null;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onClose: () => void;
}

const emptyValues: ProductFormValues = {
  name: '',
  category: 'supplement',
  imageUrl: '',
  price: 0,
  stock: 0,
};

export const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  isOpen,
  product,
  isPending,
  serverError,
  onSubmit,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyValues,
  });
  const category = watch('category') ?? 'supplement';
  const prepared = isPreparedCategory(category);

  useEffect(() => {
    if (isOpen) {
      reset(
        product
          ? {
              name: product.name,
              category: product.category,
              imageUrl: product.imageUrl,
              price: product.price,
              stock: product.stock,
            }
          : emptyValues
      );
    }
  }, [product, isOpen, reset]);

  return (
    <Drawer
      isOpen={isOpen}
      title={product ? t('Edit Product') : t('Create Product')}
      description={t('Set the category, photo, price and stock.')}
      onClose={onClose}
      onSubmitClick={handleSubmit(onSubmit)}
      submitLabel={product ? t('Update product') : t('Create product')}
      isPending={isPending}
      serverError={serverError}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField id="name" label={t('Name')} error={errors.name?.message}>
          <input id="name" className={fieldInputClass} {...register('name')} />
        </FormField>

        <FormField
          id="category"
          label={t('Category')}
          error={errors.category?.message}
        >
          <select
            id="category"
            className={fieldInputClass}
            {...register('category')}
          >
            {productCategories.map((item) => (
              <option key={item} value={item}>
                {productCategoryLabels[item]}
              </option>
            ))}
          </select>
        </FormField>

        <Controller
          control={control}
          name="imageUrl"
          render={({ field }) => (
            <ImageField
              value={field.value ?? ''}
              onChange={field.onChange}
              preview={
                <ProductImage
                  category={category}
                  imageUrl={field.value ?? ''}
                  className="h-14 w-14"
                />
              }
            />
          )}
        />

        {prepared ? <Alert tone="warning">{t(PREPARED_WARNING)}</Alert> : null}

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="price"
            label={t('Price')}
            error={errors.price?.message}
          >
            <input
              id="price"
              type="number"
              min={0}
              step="0.01"
              className={fieldInputClass}
              {...register('price', { valueAsNumber: true })}
            />
          </FormField>
          {prepared ? null : (
            <FormField
              id="stock"
              label={t('Stock')}
              error={errors.stock?.message}
            >
              <input
                id="stock"
                type="number"
                min={0}
                className={fieldInputClass}
                {...register('stock', { valueAsNumber: true })}
              />
            </FormField>
          )}
        </div>
      </form>
    </Drawer>
  );
};
