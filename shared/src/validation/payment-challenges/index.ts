import { z } from 'zod';
import { depositSchema } from '../balance';
import { subscribeMembershipSchema } from '../memberships';

export const CHALLENGE_CODE_LENGTH = 6;

// The payment the client wants to make; it is only executed after the code is verified.
export const startChallengeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('deposit'), deposit: depositSchema }),
  z.object({
    kind: z.literal('membership'),
    subscription: subscribeMembershipSchema,
  }),
]);

export const verifyChallengeSchema = z.object({
  code: z
    .string()
    .regex(
      new RegExp(`^\\d{${CHALLENGE_CODE_LENGTH}}$`),
      `Enter the ${CHALLENGE_CODE_LENGTH}-digit code.`
    ),
});

export type StartChallengeValues = z.infer<typeof startChallengeSchema>;
export type VerifyChallengeValues = z.infer<typeof verifyChallengeSchema>;
