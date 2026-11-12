import { Router } from 'express';
import { gymCountryOf, requireUser } from '@/tenant/context';

export const meRouter = Router();

meRouter.get('/', async (req, res) => {
  const user = await requireUser(req);
  res.json({
    data: {
      id: user.id,
      email: user.email,
      fullName: user.name,
      role: user.role,
      gymId: user.gymId,
      gymCountry: await gymCountryOf(user.gymId),
    },
  });
});
