import type { PaymentMethod, PaymentProviderStatus } from '../payments';

export type BalanceTransactionType =
  'deposit' | 'purchase' | 'membership' | 'refund';

export interface BalanceTransaction {
  id: string;
  gymId: string;
  clientId: string;
  type: BalanceTransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  providerStatus: PaymentProviderStatus;
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface BalanceSummary {
  balance: number;
  transactions: BalanceTransaction[];
  // Pass it as `cursor` to load the next, older page; null on the last page.
  nextCursor: string | null;
}

// Narrow the history. Dates are local calendar days (YYYY-MM-DD, inclusive);
// the amount range applies to the size of a transaction, whether money came in or went out.
export interface BalanceHistoryFilters {
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
}
