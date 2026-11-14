import type { Client as ClientRow } from '@prisma/client';
import { NotFoundError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import {
  createClientAccount,
  updateClientAccount,
  usersWithLogin,
} from '@/tenant/clientAccounts';
import type { Client } from '@gym/shared/types';
import type {
  CreateClientValues,
  UpdateClientValues,
} from '@gym/shared/validation/clients';

const toDto = (row: ClientRow, withLogin: Set<string>): Client => ({
  id: row.id,
  gymId: row.gymId,
  fullName: row.fullName,
  email: row.email,
  phone: row.phone,
  gender: row.gender,
  isActive: row.isActive,
  hasLogin: row.userId !== null && withLogin.has(row.userId),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toDtos = async (rows: ClientRow[]): Promise<Client[]> => {
  const withLogin = await usersWithLogin(rows.map((row) => row.userId));
  return rows.map((row) => toDto(row, withLogin));
};

export const clientService = {
  async list(ctx: TenantContext): Promise<Client[]> {
    const rows = await ctx.db.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return toDtos(rows);
  },

  async get(ctx: TenantContext, id: string): Promise<Client> {
    const row = await ctx.db.client.findFirst({ where: { id } });
    if (!row) {
      throw new NotFoundError('Client not found.');
    }
    return (await toDtos([row]))[0];
  },

  async create(ctx: TenantContext, input: CreateClientValues): Promise<Client> {
    return (await toDtos([await createClientAccount(ctx, input)]))[0];
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateClientValues
  ): Promise<Client> {
    return (await toDtos([await updateClientAccount(ctx, id, input)]))[0];
  },

  async setActive(
    ctx: TenantContext,
    id: string,
    isActive: boolean
  ): Promise<Client> {
    const result = await ctx.db.client.updateMany({
      where: { id },
      data: { isActive },
    });
    if (result.count === 0) {
      throw new NotFoundError('Client not found.');
    }
    return clientService.get(ctx, id);
  },
};
