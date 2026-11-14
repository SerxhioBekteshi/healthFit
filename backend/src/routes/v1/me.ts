import { Router } from 'express';
import { gymLocaleOf, requireUser } from '@/tenant/context';

export const meRouter = Router();

meRouter.get('/', async (req, res) => {
  const user = await requireUser(req);
  const locale = await gymLocaleOf(user.gymId);
  res.json({
    data: {
      id: user.id,
      email: user.email,
      fullName: user.name,
      role: user.role,
      gymId: user.gymId,
      gymCountry: locale?.country ?? null,
      gymCurrency: locale?.currency ?? null,
    },
  });
});
