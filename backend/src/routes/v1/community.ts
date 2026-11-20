import { Router } from 'express';
import { ok, parseBody, parseQuery, withCommunity } from '@/http/withTenant';
import { communityService } from '@/services/community';
import {
  communityGymsQuerySchema,
  communityJoinSchema,
} from '@gym/shared/validation/community';

// For a signed-in client who has not joined a gym yet.
export const communityRouter = Router();

communityRouter.get(
  '/gyms',
  withCommunity(async (ctx, req) =>
    ok(
      await communityService.listGyms(
        ctx,
        parseQuery(req, communityGymsQuerySchema)
      )
    )
  )
);

communityRouter.post(
  '/join',
  withCommunity(async (ctx, req) => {
    const { gymId } = parseBody(req, communityJoinSchema);
    return ok(await communityService.join(ctx, gymId), 201);
  })
);
