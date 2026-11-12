import type { PrismaClient } from '@prisma/client';

const TENANT_MODELS = new Set([
  'User',
  'Client',
  'GymClosure',
  'GymLocation',
  'StaffMember',
  'GymClass',
  'MembershipPlan',
  'GymPhoto',
  'PriceListNote',
  'PaymentChallenge',
  'Membership',
  'Attendance',
  'Product',
  'ProductSale',
  'BalanceTransaction',
  'WorkoutProgram',
  'WorkoutDay',
  'Exercise',
  'GymSubscription',
  'GymSubscriptionPayment',
]);

const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const WHERE_WRITE_OPERATIONS = new Set([
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

type Args = Record<string, unknown>;

const withoutGymId = (data: unknown): unknown => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const rest = { ...(data as Args) };
    delete rest.gymId;
    return rest;
  }
  return data;
};

// Fails closed: unknown models/operations throw instead of running unscoped.
// Nested relation reads are safe because tenant rows only relate to rows of the same gym.
export const createTenantDb = (prisma: PrismaClient, gymId: string) =>
  prisma.$extends({
    name: 'tenantScope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const isGym = model === 'Gym';
          if (!isGym && !TENANT_MODELS.has(model)) {
            throw new Error(
              `Model ${model} is not available in a tenant scope.`
            );
          }

          const scope: Args = isGym ? { id: gymId } : { gymId };
          const base = (args ?? {}) as Args;
          let next: Args;

          if (READ_OPERATIONS.has(operation)) {
            next = { ...base, where: { ...(base.where as Args), ...scope } };
          } else if (WHERE_WRITE_OPERATIONS.has(operation)) {
            if (isGym && operation.startsWith('delete')) {
              throw new Error('A tenant cannot delete a gym.');
            }
            next = { ...base, where: { ...(base.where as Args), ...scope } };
            if ('data' in base) {
              next.data = withoutGymId(base.data);
            }
          } else if (!isGym && operation === 'create') {
            next = { ...base, data: { ...(base.data as Args), ...scope } };
          } else if (!isGym && operation === 'createMany') {
            const data = base.data;
            next = {
              ...base,
              data: Array.isArray(data)
                ? data.map((row) => ({ ...(row as Args), ...scope }))
                : { ...(data as Args), ...scope },
            };
          } else if (!isGym && operation === 'upsert') {
            next = {
              ...base,
              where: { ...(base.where as Args), ...scope },
              create: { ...(base.create as Args), ...scope },
              update: withoutGymId(base.update),
            };
          } else {
            throw new Error(
              `Operation ${operation} on ${model} is not allowed in a tenant scope.`
            );
          }

          return query(next as typeof args);
        },
      },
    },
  });

export type TenantDb = ReturnType<typeof createTenantDb>;
