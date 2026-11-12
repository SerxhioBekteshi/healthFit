import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { Product as ProductRow } from '@prisma/client';
import { chargePayment } from '@/payments';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';
import { ledger } from '@/services/ledger';
import { uploadService } from '@/services/uploads';
import type { TenantContext } from '@/tenant/context';
import { retryOnConflict } from '@/utils/transactions';
import type { Product } from '@gym/shared/types';
import {
  isPreparedCategory,
  type ProductFormValues,
  type PurchaseProductValues,
} from '@gym/shared/validation/products';

const toDto = (row: ProductRow): Product => ({
  id: row.id,
  gymId: row.gymId,
  name: row.name,
  category: row.category,
  imageUrl: row.imageUrl,
  price: row.price.toNumber(),
  stock: row.stock,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

// Fields left out of the request keep their current value on update.
const toData = (
  ctx: TenantContext,
  input: ProductFormValues,
  current?: ProductRow
) => {
  const category = input.category ?? current?.category ?? 'supplement';
  return {
    name: input.name,
    category,
    imageUrl:
      input.imageUrl === undefined
        ? (current?.imageUrl ?? '')
        : uploadService.requireOwnImage(ctx, input.imageUrl),
    price: input.price.toFixed(2),
    // Made-to-order items have no stock to track.
    stock: isPreparedCategory(category) ? 0 : input.stock,
  };
};

const requireProduct = async (
  ctx: TenantContext,
  id: string
): Promise<ProductRow> => {
  const row = await ctx.db.product.findFirst({ where: { id } });
  if (!row) {
    throw new NotFoundError('Product not found.');
  }
  return row;
};

export const productService = {
  async list(ctx: TenantContext): Promise<Product[]> {
    const rows = await ctx.db.product.findMany({
      // Clients only see what they can actually buy; shakes and smoothies are always made fresh.
      where:
        ctx.role === 'client'
          ? {
              isActive: true,
              OR: [
                { stock: { gt: 0 } },
                { category: { in: ['shake', 'smoothie'] } },
              ],
            }
          : {},
      orderBy: { name: 'asc' },
    });
    return rows.map(toDto);
  },

  async create(ctx: TenantContext, input: ProductFormValues): Promise<Product> {
    const row = await ctx.db.product.create({
      data: { gymId: ctx.gymId, ...toData(ctx, input) },
    });
    return toDto(row);
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: ProductFormValues
  ): Promise<Product> {
    const current = await requireProduct(ctx, id);
    await ctx.db.product.updateMany({
      where: { id },
      data: toData(ctx, input, current),
    });
    return toDto(await requireProduct(ctx, id));
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean
  ): Promise<Product> {
    await requireProduct(ctx, id);
    await ctx.db.product.updateMany({ where: { id }, data: { isActive } });
    return toDto(await requireProduct(ctx, id));
  },

  // Takes one unit of stock and charges for it atomically, so it cannot oversell or overdraw.
  async sell(
    ctx: TenantContext,
    productId: string,
    input: PurchaseProductValues
  ): Promise<Product> {
    const method = input.paymentMethod;
    if (ctx.role === 'client' && method !== 'balance') {
      throw new ForbiddenError('Clients can only pay from their balance.');
    }
    const clientId =
      ctx.role === 'client' ? ctx.clientId : (input.clientId ?? null);
    if (method === 'balance' && !clientId) {
      throw new ValidationError('Select a client to charge their balance.');
    }
    if (clientId) {
      const client = await ctx.db.client.findFirst({ where: { id: clientId } });
      if (!client) {
        throw new NotFoundError('Client not found.');
      }
      if (!client.isActive) {
        throw new ValidationError('This client account is not active.');
      }
    }

    const product = await ctx.db.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      throw new NotFoundError('Product not found or unavailable.');
    }
    if (isPreparedCategory(product.category)) {
      if (ctx.role === 'client') {
        throw new ForbiddenError(
          'Shakes and smoothies are made at the counter and paid in cash.'
        );
      }
      if (method !== 'cash') {
        throw new ValidationError(
          'Shakes and smoothies can only be paid in cash.'
        );
      }
    }

    let providerReference = '';
    if (method !== 'balance') {
      const result = await chargePayment(method, {
        amount: product.price.toNumber(),
        clientId: clientId ?? '',
        description: `Purchase: ${product.name}`,
        metadata: { gymId: ctx.gymId, productId, kind: 'purchase' },
      });
      if (result.status !== 'succeeded') {
        throw new ValidationError(result.message || 'Payment failed.');
      }
      providerReference = result.providerReference;
    }

    await retryOnConflict(() =>
      ctx.db.$transaction(
        async (tx) => {
          const fresh = await tx.product.findFirst({
            where: { id: productId, isActive: true },
          });
          if (!fresh) {
            throw new NotFoundError('Product not found or unavailable.');
          }
          const taken = isPreparedCategory(fresh.category)
            ? { count: 1 }
            : await tx.product.updateMany({
                where: { id: productId, stock: { gt: 0 } },
                data: { stock: { decrement: 1 } },
              });
          if (taken.count === 0) {
            throw new ValidationError('This product is out of stock.');
          }

          let amount = new Prisma.Decimal(0);
          if (method === 'balance' && clientId) {
            const balance = await ledger.balance(tx, clientId);
            if (balance.lessThan(fresh.price)) {
              throw new ValidationError(
                'Client balance is insufficient for this purchase.'
              );
            }
            amount = fresh.price.negated();
          }

          const sale = await tx.productSale.create({
            data: {
              gymId: ctx.gymId,
              productId,
              clientId,
              quantity: 1,
              unitPrice: fresh.price,
              total: fresh.price,
              paymentMethod: method,
            },
          });

          if (clientId) {
            await tx.balanceTransaction.create({
              data: {
                gymId: ctx.gymId,
                clientId,
                type: 'purchase',
                amount,
                paymentMethod: method,
                providerStatus: 'paid',
                description: `Purchase: ${fresh.name}`,
                referenceId:
                  providerReference ||
                  `BAL-${randomBytes(4).toString('hex').toUpperCase()}`,
              },
            });
          }
          return sale;
        },
        { isolationLevel: 'Serializable' }
      )
    );

    return toDto(await requireProduct(ctx, productId));
  },
};
