import type { BalanceTransaction } from '../balance';
import type { Membership } from '../memberships';

// A started verification: the client now has to enter the one-time code.
export interface PaymentChallenge {
  challengeId: string;
  expiresAt: string;
  // Only outside production: stands in for the SMS/bank-app code a real issuer would send.
  demoCode?: string;
}

export type PaymentChallengeResult =
  | { kind: 'deposit'; transaction: BalanceTransaction }
  | { kind: 'membership'; membership: Membership };
