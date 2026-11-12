import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { TenantContext } from '@/tenant/context';
import { createTenantDb } from '@/tenant/scopedDb';
import { balanceService } from '@/services/balance';
import { productService } from '@/services/products';
import { ForbiddenError, NotFoundError, ValidationError } from '@/errors';

const prisma = new PrismaClient();

let gymAId: string;
let gymBId: string;
let clientAId: string;
let clientBId: string;
let productAId: string;

const adminContext = (gymId: string): TenantContext => ({
  user: {
    id: `admin-${gymId}`,
    email: `admin-${gymId}@test.dev`,
    name: 'Admin',
    role: 'gym_admin',
    gymId,
  },
  role: 'gym_admin',
  gymId,
  clientId: null,
  db: createTenantDb(prisma, gymId),
});

const clientContext = (gymId: string, clientId: string): TenantContext => ({
  ...adminContext(gymId),
  user: {
    id: `user-${clientId}`,
    email: 'c@test.dev',
    name: 'Client',
    role: 'client',
    gymId,
  },
  role: 'client',
  clientId,
});

const wipe = async (): Promise<void> => {
  await prisma.productSale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.client.deleteMany();
  await prisma.gym.deleteMany();
};

const stockOf = async (id: string): Promise<number> =>
  (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;

beforeEach(async () => {
  expect(process.env.DATABASE_URL).toContain('gym_app_test');
  await wipe();
  gymAId = (await prisma.gym.create({ data: { name: 'A' } })).id;
  gymBId = (await prisma.gym.create({ data: { name: 'B' } })).id;
  clientAId = (
    await prisma.client.create({
      data: { gymId: gymAId, fullName: 'A', email: 'a@test.dev' },
    })
  ).id;
  clientBId = (
    await prisma.client.create({
      data: { gymId: gymBId, fullName: 'B', email: 'b@test.dev' },
    })
  ).id;
  productAId = (
    await productService.create(adminContext(gymAId), {
      name: 'Shake',
      price: 4.5,
      stock: 3,
    })
  ).id;
});

afterAll(async () => {
  await wipe();
  await prisma.$disconnect();
});

describe('balanceService', () => {
  it('adds deposits to the ledger and reports the summed balance', async () => {
    const ctx = clientContext(gymAId, clientAId);
    await balanceService.deposit(
      ctx,
      { amount: 20, paymentMethod: 'card' },
      { verified: true }
    );
    await balanceService.deposit(
      ctx,
      { amount: 5.5, paymentMethod: 'card' },
      { verified: true }
    );

    const summary = await balanceService.summary(ctx);
    expect(summary.balance).toBe(25.5);
    expect(summary.transactions).toHaveLength(2);
    expect(summary.nextCursor).toBeNull();
  });

  it('pages the history newest first without repeats', async () => {
    const ctx = clientContext(gymAId, clientAId);
    for (let index = 1; index <= 5; index += 1) {
      await balanceService.deposit(
        ctx,
        { amount: index, paymentMethod: 'card' },
        { verified: true }
      );
    }

    const first = await balanceService.summary(ctx, undefined, { limit: 2 });
    expect(first.transactions.map((row) => row.amount)).toEqual([5, 4]);
    expect(first.nextCursor).not.toBeNull();

    const second = await balanceService.summary(ctx, undefined, {
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.transactions.map((row) => row.amount)).toEqual([3, 2]);

    const last = await balanceService.summary(ctx, undefined, {
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });
    expect(last.transactions.map((row) => row.amount)).toEqual([1]);
    expect(last.nextCursor).toBeNull();
    expect(last.balance).toBe(15);
  });

  it('filters the history by amount and by day, keeping the full balance', async () => {
    const ctx = clientContext(gymAId, clientAId);
    const row = (
      type: 'deposit' | 'purchase' | 'membership',
      amount: string,
      createdAt: string
    ) =>
      prisma.balanceTransaction.create({
        data: {
          gymId: gymAId,
          clientId: clientAId,
          type,
          amount,
          paymentMethod: 'cash',
          providerStatus: 'paid',
          createdAt: new Date(`${createdAt}T12:00:00Z`),
        },
      });
    await row('deposit', '5.00', '2026-11-01');
    await row('deposit', '20.00', '2026-11-05');
    await row('purchase', '-20.00', '2026-11-08');
    await row('membership', '-100.00', '2026-11-09');
    const amounts = async (
      filters: Parameters<typeof balanceService.summary>[2]
    ) =>
      (await balanceService.summary(ctx, undefined, filters)).transactions
        .map((item) => item.amount)
        .sort((a, b) => a - b);

    // The amount range is the size of a transaction, so money out matches too.
    expect(await amounts({ minAmount: 20 })).toEqual([-100, -20, 20]);
    expect(await amounts({ maxAmount: 20 })).toEqual([-20, 5, 20]);
    expect(await amounts({ minAmount: 10, maxAmount: 50 })).toEqual([-20, 20]);
    expect(await amounts({ from: '2026-11-05', to: '2026-11-08' })).toEqual([
      -20, 20,
    ]);
    expect(await amounts({ from: '2026-11-05', minAmount: 50 })).toEqual([
      -100,
    ]);

    // Filters and paging work together, and the balance stays the whole ledger.
    const first = await balanceService.summary(ctx, undefined, {
      minAmount: 20,
      limit: 2,
    });
    expect(first.transactions.map((item) => item.amount)).toEqual([-100, -20]);
    const second = await balanceService.summary(ctx, undefined, {
      minAmount: 20,
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.transactions.map((item) => item.amount)).toEqual([20]);
    expect(second.nextCursor).toBeNull();
    expect(second.balance).toBe(-95);
  });

  it('lets only gym staff take cash deposits', async () => {
    await expect(
      balanceService.deposit(clientContext(gymAId, clientAId), {
        amount: 10,
        paymentMethod: 'cash',
      })
    ).rejects.toBeInstanceOf(ForbiddenError);

    const admin = adminContext(gymAId);
    await balanceService.deposit(admin, {
      amount: 10,
      paymentMethod: 'cash',
      clientId: clientAId,
    });
    expect((await balanceService.summary(admin, clientAId)).balance).toBe(10);
  });

  it('ignores a client-supplied clientId and keeps gyms apart', async () => {
    const ctx = clientContext(gymAId, clientAId);
    await balanceService.deposit(
      ctx,
      {
        amount: 10,
        paymentMethod: 'card',
        clientId: clientBId,
      },
      { verified: true }
    );
    expect((await balanceService.summary(ctx)).balance).toBe(10);
    expect(
      await prisma.balanceTransaction.count({ where: { clientId: clientBId } })
    ).toBe(0);

    const adminA = adminContext(gymAId);
    await expect(
      balanceService.deposit(adminA, {
        amount: 10,
        paymentMethod: 'cash',
        clientId: clientBId,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      balanceService.summary(adminA, clientBId)
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(balanceService.summary(adminA)).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it('does not count pending ledger rows in the balance', async () => {
    await prisma.balanceTransaction.createMany({
      data: [
        {
          gymId: gymAId,
          clientId: clientAId,
          type: 'deposit',
          amount: '30.00',
          paymentMethod: 'bank_transfer',
          providerStatus: 'pending',
        },
        {
          gymId: gymAId,
          clientId: clientAId,
          type: 'deposit',
          amount: '10.00',
          paymentMethod: 'cash',
          providerStatus: 'paid',
        },
      ],
    });
    const summary = await balanceService.summary(
      clientContext(gymAId, clientAId)
    );
    expect(summary.balance).toBe(10);
  });
});

describe('productService', () => {
  it('shows clients only active products that are in stock', async () => {
    const admin = adminContext(gymAId);
    await productService.create(admin, { name: 'Empty', price: 1, stock: 0 });
    const hidden = await productService.create(admin, {
      name: 'Hidden',
      price: 1,
      stock: 5,
    });
    await productService.setActive(admin, hidden.id, false);

    const forClient = await productService.list(
      clientContext(gymAId, clientAId)
    );
    expect(forClient.map((p) => p.name)).toEqual(['Shake']);
    expect(await productService.list(admin)).toHaveLength(3);
  });

  it('sells from the balance: decrements stock and debits the ledger', async () => {
    await balanceService.deposit(adminContext(gymAId), {
      amount: 10,
      paymentMethod: 'cash',
      clientId: clientAId,
    });
    const ctx = clientContext(gymAId, clientAId);
    const product = await productService.sell(ctx, productAId, {
      paymentMethod: 'balance',
    });

    expect(product.stock).toBe(2);
    expect((await balanceService.summary(ctx)).balance).toBe(5.5);
    expect(await prisma.productSale.count()).toBe(1);
  });

  it('rejects insufficient balance without changing stock', async () => {
    const ctx = clientContext(gymAId, clientAId);
    await expect(
      productService.sell(ctx, productAId, { paymentMethod: 'balance' })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await stockOf(productAId)).toBe(3);
    expect(await prisma.productSale.count()).toBe(0);
  });

  it('does not let clients pay with anything but their balance', async () => {
    await expect(
      productService.sell(clientContext(gymAId, clientAId), productAId, {
        paymentMethod: 'cash',
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(await stockOf(productAId)).toBe(3);
  });

  it('records counter sales for gym admins with or without a client', async () => {
    const admin = adminContext(gymAId);
    await productService.sell(admin, productAId, { paymentMethod: 'cash' });
    await productService.sell(admin, productAId, {
      paymentMethod: 'card',
      clientId: clientAId,
    });

    expect(await stockOf(productAId)).toBe(1);
    expect(await prisma.productSale.count()).toBe(2);
    // Only the sale tied to a client creates a ledger row.
    expect(await prisma.balanceTransaction.count()).toBe(1);
    await expect(
      productService.sell(admin, productAId, { paymentMethod: 'balance' })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('keeps no stock for shakes and smoothies, which are cash only at the counter', async () => {
    const admin = adminContext(gymAId);
    const shake = await productService.create(admin, {
      name: 'Protein Shake',
      category: 'shake',
      price: 4,
      stock: 25,
    });
    expect(shake.stock).toBe(0);

    // Clients still see it, but cannot buy it online.
    const client = clientContext(gymAId, clientAId);
    expect((await productService.list(client)).map((p) => p.name)).toContain(
      'Protein Shake'
    );
    await expect(
      productService.sell(client, shake.id, { paymentMethod: 'balance' })
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      productService.sell(admin, shake.id, { paymentMethod: 'card' })
    ).rejects.toBeInstanceOf(ValidationError);
    const sold = await productService.sell(admin, shake.id, {
      paymentMethod: 'cash',
    });
    expect(sold.stock).toBe(0);
    expect(await prisma.productSale.count()).toBe(1);
  });

  it('only accepts product photos uploaded by the same gym', async () => {
    const admin = adminContext(gymAId);
    const product = await productService.create(admin, {
      name: 'With photo',
      price: 1,
      stock: 1,
      imageUrl: `/uploads/${gymAId}/photo.jpg`,
    });
    expect(product.imageUrl).toBe(`/uploads/${gymAId}/photo.jpg`);

    await expect(
      productService.update(admin, product.id, {
        name: 'With photo',
        price: 1,
        stock: 1,
        imageUrl: `/uploads/${gymBId}/photo.jpg`,
      })
    ).rejects.toBeInstanceOf(ValidationError);

    // Leaving the photo out keeps it; an empty value removes it.
    const kept = await productService.update(admin, product.id, {
      name: 'Renamed',
      price: 1,
      stock: 1,
    });
    expect(kept.imageUrl).toBe(`/uploads/${gymAId}/photo.jpg`);
    const removed = await productService.update(admin, product.id, {
      name: 'Renamed',
      price: 1,
      stock: 1,
      imageUrl: '',
    });
    expect(removed.imageUrl).toBe('');
  });

  it('never oversells under concurrent purchases', async () => {
    await prisma.product.update({
      where: { id: productAId },
      data: { stock: 1 },
    });
    const admin = adminContext(gymAId);
    const results = await Promise.allSettled([
      productService.sell(admin, productAId, { paymentMethod: 'cash' }),
      productService.sell(admin, productAId, { paymentMethod: 'cash' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await stockOf(productAId)).toBe(0);
    expect(await prisma.productSale.count()).toBe(1);
  });

  it('never overdraws the balance under concurrent purchases', async () => {
    await balanceService.deposit(adminContext(gymAId), {
      amount: 5,
      paymentMethod: 'cash',
      clientId: clientAId,
    });
    const ctx = clientContext(gymAId, clientAId);
    const results = await Promise.allSettled([
      productService.sell(ctx, productAId, { paymentMethod: 'balance' }),
      productService.sell(ctx, productAId, { paymentMethod: 'balance' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await balanceService.summary(ctx)).balance).toBe(0.5);
    expect(await stockOf(productAId)).toBe(2);
  });

  it('is isolated between gyms', async () => {
    const adminB = adminContext(gymBId);
    await expect(
      productService.sell(adminB, productAId, { paymentMethod: 'cash' })
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      productService.update(adminB, productAId, {
        name: 'x',
        price: 1,
        stock: 1,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      productService.setActive(adminB, productAId, false)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await productService.list(adminB)).toHaveLength(0);
    expect(await stockOf(productAId)).toBe(3);

    await expect(
      productService.sell(adminContext(gymAId), productAId, {
        paymentMethod: 'card',
        clientId: clientBId,
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
