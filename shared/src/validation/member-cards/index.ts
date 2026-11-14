import { z } from 'zod';

export const issueCardSchema = z.object({
  clientId: z.string().trim().min(1, 'Select a member.'),
  number: z
    .string()
    .trim()
    .min(3, 'The card number is too short.')
    .max(32, 'The card number is too long.')
    .regex(
      /^[A-Za-z0-9-]+$/,
      'The card number can only have letters, numbers and dashes.'
    ),
});

export type IssueCardValues = z.infer<typeof issueCardSchema>;
