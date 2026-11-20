import { z } from 'zod';
import { COUNTRY_CODES } from '../gyms';

export const communityJoinSchema = z.object({
  gymId: z.string().min(1, 'Choose a gym.'),
});

// `country` filters the gyms; `all` shows every country. Without it the member's own country is used.
export const communityGymsQuerySchema = z.object({
  country: z.enum([...COUNTRY_CODES, 'all']).optional(),
});

export type CommunityJoinValues = z.infer<typeof communityJoinSchema>;
export type CommunityGymsQuery = z.infer<typeof communityGymsQuerySchema>;
