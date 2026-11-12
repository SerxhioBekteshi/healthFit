import type { Client as ClientRow } from '@prisma/client';
import { NotFoundError } from '@/errors';
import type { TenantContext } from '@/tenant/context';
import {
  createClientAccount,
  updateClientAccount,
} from '@/tenant/clientAccounts';
import type { Client } from '@gym/shared/types';
import type {
  CreateClientValues,
  UpdateClientValues,
} from '@gym/shared/validation/clients';

const toDto = (row: ClientRow): Client => ({
  id: row.id,
  gymId: row.gymId,
  fullName: row.fullName,
  email: row.email,
  phone: row.phone,
  gender: row.gender,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const clientService = {
  async list(ctx: TenantContext): Promise<Client[]> {
    const rows = await ctx.db.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  },

  async get(ctx: TenantContext, id: string): Promise<Client> {
    const row = await ctx.db.client.findFirst({ where: { id } });
    if (!row) {
      throw new NotFoundError('Client not found.');
    }
    return toDto(row);
  },

  async create(ctx: TenantContext, input: CreateClientValues): Promise<Client> {
    return toDto(await createClientAccount(ctx, input));
  },

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateClientValues
  ): Promise<Client> {
    return toDto(await updateClientAccount(ctx, id, input));
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
