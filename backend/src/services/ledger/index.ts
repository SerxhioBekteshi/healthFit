import { Prisma } from '@prisma/client';
import type { TenantDb } from '@/tenant/scopedDb';

type LedgerDb = Pick<TenantDb, 'balanceTransaction'>;

export const ledger = {
  // Balance is the sum of settled ledger rows; there is no mutable balance column.
  async balance(db: LedgerDb, clientId: string): Promise<Prisma.Decimal> {
    const result = await db.balanceTransaction.aggregate({
      where: { clientId, providerStatus: 'paid' },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  },
};
