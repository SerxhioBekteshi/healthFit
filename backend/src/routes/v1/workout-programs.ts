import { Router } from 'express';
import { ok, parseBody, withTenant } from '@/http/withTenant';
import { workoutProgramService } from '@/services/workout-programs';
import { workoutProgramInputSchema } from '@gym/shared/validation/workout-programs';

export const workoutProgramsRouter = Router();

workoutProgramsRouter.get(
  '/',
  withTenant(['gym_admin', 'client'], async (ctx) =>
    ok(await workoutProgramService.list(ctx))
  )
);

workoutProgramsRouter.post(
  '/',
  withTenant(['gym_admin'], async (ctx, req) => {
    const input = parseBody(req, workoutProgramInputSchema);
    return ok(await workoutProgramService.create(ctx, input), 201);
  })
);

workoutProgramsRouter.patch(
  '/:id',
  withTenant(['gym_admin'], async (ctx, req, params) => {
    const input = parseBody(req, workoutProgramInputSchema);
    return ok(await workoutProgramService.update(ctx, params.id, input));
  })
);

workoutProgramsRouter.delete(
  '/:id',
  withTenant(['gym_admin'], async (ctx, _req, params) => {
    await workoutProgramService.remove(ctx, params.id);
    return ok({ id: params.id });
  })
);
