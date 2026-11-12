# Gym App Skills - Reusable Patterns

Templates for common tasks. Copy and adapt. Rules: `.github/instructions/{backend,frontend,shared}.instructions.md`.

---

## 0. New Feature Skeleton (domain folders)

One domain name, reused in every layer. For a new domain `suppliers`:

```
shared/src/types/suppliers/index.ts               + export * from './suppliers' in shared/src/types/index.ts
shared/src/validation/suppliers/index.ts
backend/src/services/suppliers/index.ts           + index.test.ts beside it
backend/src/routes/v1/suppliers.ts                + mount in backend/src/routes/v1/index.ts
mobile/API_CONTRACT.md                            (add the endpoint rows)
frontend/src/services/suppliers/index.ts
frontend/src/hooks/suppliers/index.ts
frontend/src/views/gym/suppliers/SuppliersPage.tsx       (area: gym | super-admin | client)
frontend/src/views/gym/suppliers/SupplierFormDrawer.tsx  (built on components/ui/Drawer, beside the page)
frontend/src/routes/index.tsx                     (add the route inside the role shell)
frontend/src/utils/constants/navigation/index.ts  (add the nav item)
```

Imports: backend/frontend use `@/` for their own `src`; shared code is `@gym/shared/types` and `@gym/shared/validation/suppliers`.

---

## 1. Zod Schema (shared by backend and frontend)

```ts
// shared/src/validation/clients/index.ts
import { z } from 'zod';

export const createClientSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{8,15}$/, 'Invalid phone number'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
```

---

## 2. Form (React Hook Form + Zod)

```tsx
// frontend/src/views/gym/clients/ClientForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createClientSchema,
  type CreateClientInput,
} from '@gym/shared/validation/clients';

interface ClientFormProps {
  onSubmit: (data: CreateClientInput) => void;
  isLoading: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientInput>({ resolver: zodResolver(createClientSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        {...register('email')}
        type="email"
        className="w-full rounded-md border px-3 py-2"
      />
      {errors.email && (
        <p className="text-sm text-red-500">{errors.email.message}</p>
      )}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};
```

---

## 3. Prisma Model (tenant-scoped)

```prisma
model Product {
  id        String   @id @default(cuid())
  gymId     String
  name      String
  price     Decimal  @db.Decimal(10, 2)
  stock     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  gym       Gym      @relation(fields: [gymId], references: [id], onDelete: Cascade)

  @@index([gymId])
}
```

---

## 4. Backend Service (uses the tenant-scoped db)

```ts
// backend/src/services/products/index.ts
import type { TenantContext } from '@/tenant/context';
import type { CreateProductInput } from '@gym/shared/validation/products';
import { NotFoundError } from '@/errors';

export const productService = {
  list: (ctx: TenantContext) =>
    ctx.db.product.findMany({ orderBy: { name: 'asc' } }),

  create: (ctx: TenantContext, input: CreateProductInput) =>
    // The type requires gymId; the scoped db also forces it to the session gym.
    ctx.db.product.create({ data: { gymId: ctx.gymId, ...input } }),

  async update(
    ctx: TenantContext,
    id: string,
    input: Partial<CreateProductInput>
  ) {
    const existing = await ctx.db.product.findFirst({ where: { id } });
    if (!existing) throw new NotFoundError('Product not found');
    return ctx.db.product.update({ where: { id }, data: input });
  },
};
```

---

## 5. Backend Route (thin Express router)

```ts
// backend/src/routes/v1/products.ts
import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { productService } from '@/services/products';
import { createProductSchema } from '@gym/shared/validation/products';

export const productsRouter = Router();

productsRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await productService.list(ctx))
  )
);

productsRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, createProductSchema); // ZodError -> 422
    return ok(await productService.create(ctx, input), 201);
  })
);

productsRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) =>
    ok(
      await productService.update(
        ctx,
        params.id,
        parseBody(req, createProductSchema)
      )
    )
  )
);
```

Mount it in `backend/src/routes/v1/index.ts` with `v1Router.use('/products', productsRouter)`. `withTenant(roles, handler)` runs `requireTenant(req, roles)` (cookie or bearer session) and the error middleware maps `ZodError`, `NotFoundError`, `ForbiddenError` to 422, 404, 403.

---

## 6. Frontend Service and React Query Hook

```ts
// frontend/src/services/products/index.ts
import { apiClient } from '@/services/api';
import type { Product } from '@gym/shared/types';
import type { CreateProductInput } from '@gym/shared/validation/products';

export const productsService = {
  list: () => apiClient.get<Product[]>('/products'),
  create: (input: CreateProductInput) =>
    apiClient.post<Product>('/products', input),
};
```

```ts
// frontend/src/hooks/products/index.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/products';

export const useProducts = () =>
  useQuery({ queryKey: ['products'], queryFn: productsService.list });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Shown as a success toast by providers/QueryProvider; errors toast automatically.
    meta: { success: 'Product created.' },
    mutationFn: productsService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
};
```

### Lazy-loaded history (cursor paging)

```ts
// backend service: take + 1 rows tell whether another page exists
const rows = await ctx.db.attendance.findMany({
  orderBy: [{ checkedInAt: 'desc' }, { id: 'desc' }],
  take: take + 1,
  ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
});
const items = rows.slice(0, take);
return {
  records: items.map(toDto),
  nextCursor: rows.length > take ? items[items.length - 1].id : null,
};
```

```tsx
// frontend hook + list (see hooks/attendance, components/ui/LoadMore)
const query = useInfiniteQuery({
  queryKey: ['attendance', 'history'],
  queryFn: ({ pageParam }) => attendanceService.history(pageParam),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (last) => last.nextCursor ?? undefined,
});
// <div className="max-h-[15rem] overflow-y-auto"><List /><LoadMore {...pagination} itemCount={records.length} /></div>
```

---

## 7. Route and Role Guard

```tsx
// frontend/src/routes/index.tsx - a route inside a role shell
{
  Component: shell('gym_admin'), // AuthShell role="gym_admin" + <Outlet />
  children: [
    {
      path: '/suppliers',
      ...page(() => import('@/views/gym/suppliers/SuppliersPage'), 'SuppliersPage'),
    },
  ],
},
```

`AuthShell` redirects by role from `useSession()` and renders `BaseLayout`. The real authority is `withTenant(['gym_admin'], ...)` in the backend routes; client role checks only redirect and hide UI.

---

## 8. Money and Ledger

```ts
await ctx.db.$transaction(async (tx) => {
  await tx.balanceTransaction.create({
    data: {
      gymId: ctx.gymId,
      clientId,
      type: 'purchase',
      amount: new Prisma.Decimal(-price),
    },
  });
  await tx.product.update({ where: { id }, data: { stock: { decrement: 1 } } });
});
// Balance = SUM(amount) of the client's ledger rows. Never a mutable balance column.
```

---

## 9. Tenant Isolation Test

```ts
it("does not return another gym's clients", async () => {
  const ctxA = await contextFor('gym-a-admin');
  const clients = await clientService.list(ctxA);
  expect(clients.every((c) => c.gymId === gymA.id)).toBe(true);
  await expect(clientService.get(ctxA, gymBClient.id)).rejects.toThrow(
    NotFoundError
  );
});
```

---

## 10. Mobile Auth Call

```ts
const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const token = res.headers.get('set-auth-token'); // store in secure storage

await fetch(`${BASE_URL}/api/v1/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
```
